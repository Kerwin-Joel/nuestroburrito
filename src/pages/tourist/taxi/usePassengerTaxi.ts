import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { spotsService } from '../../../services/spots'
import type { Spot } from '../../../types/spot'
import {
  bearing, distanceM, dropoffOf, pickupOf, TaxiError, taxiService,
  type GeoPoint, type NearbyDriver, type Offer, type Quote, type Ride,
} from '../../../services/taxi'

/**
 * Pasajero: elegir destino (spot o punto en el mapa) → cotizar → proponer
 * precio → ver ofertas en vivo → aceptar → PIN → seguimiento → calificar.
 * Espejo de PassengerTaxiViewModel.kt (misma lógica, mismos textos).
 */

export type Stage = 'setup' | 'quoted' | 'waiting' | 'on_the_way' | 'completed'

export interface TaxiState {
  stage: Stage
  me: GeoPoint | null
  locating: boolean
  nearbyDrivers: NearbyDriver[]
  spots: Spot[]
  query: string
  dropoff: GeoPoint | null
  dropoffAddress: string
  spotId: string | null
  quote: Quote | null
  offeredFare: number
  note: string
  ride: Ride | null
  offers: Offer[]
  pin: string | null
  driverLocation: GeoPoint | null
  driverHeading: number | null
  driverMoving: boolean
  routePath: GeoPoint[]
  routeKm: number | null
  routeMinutes: number | null
  driverPath: GeoPoint[]
  driverRouteMinutes: number | null
  busy: boolean
  error: string | null
}

const INITIAL: TaxiState = {
  stage: 'setup', me: null, locating: true, nearbyDrivers: [], spots: [], query: '',
  dropoff: null, dropoffAddress: '', spotId: null, quote: null, offeredFare: 0, note: '',
  ride: null, offers: [], pin: null, driverLocation: null, driverHeading: null, driverMoving: false,
  routePath: [], routeKm: null, routeMinutes: null, driverPath: [], driverRouteMinutes: null,
  busy: false, error: null,
}

const FARE_STEP = 0.5
const toPath = (pts: [number, number][]) => pts.map(([lat, lng]) => ({ lat, lng }))
const errText = (e: unknown, fallback: string) => (e instanceof TaxiError ? e.message : fallback)

export function usePassengerTaxi(initial?: { dest?: GeoPoint; name?: string; spotId?: string }) {
  const [s, setS] = useState<TaxiState>(INITIAL)
  // El ref es la fuente de verdad (se actualiza al instante, sin esperar al render):
  // las funciones asíncronas leen siempre el estado más reciente.
  const ref = useRef(s)
  const set = useCallback((patch: Partial<TaxiState> | ((p: TaxiState) => Partial<TaxiState>)) => {
    const next = { ...ref.current, ...(typeof patch === 'function' ? patch(ref.current) : patch) }
    ref.current = next
    setS(next)
  }, [])

  const jobs = useRef<{ offers?: ReturnType<typeof setInterval>; unwatch?: () => void; watchedRide?: string }>({})
  const motion = useRef<{ last: GeoPoint | null }>({ last: null })
  const follower = useRef<{ to: GeoPoint | null; from: GeoPoint | null; at: number }>({ to: null, from: null, at: 0 })
  const lastTrack = useRef(0)
  // Referencias a las funciones de abajo, para los avisos en vivo y el arranque.
  const applyRideRef = useRef<(r: Ride) => void>(() => {})
  const selectDestinationRef = useRef<(d: GeoPoint, name: string, spotId: string | null) => void>(() => {})

  // ── Ubicación propia (y GPS al servidor durante el viaje) ──
  useEffect(() => {
    if (!navigator.geolocation) {
      set({ locating: false, error: 'Activa tu ubicación para pedir un taxi' })
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        set({ me, locating: false })
        const st = ref.current
        // Mientras dura el viaje se reporta cada ~3 s: valida que vas a bordo.
        if (st.stage === 'on_the_way' && Date.now() - lastTrack.current > 3000) {
          lastTrack.current = Date.now()
          taxiService.track(me.lat, me.lng, pos.coords.accuracy, pos.coords.speed, pos.coords.heading).catch(() => {})
        }
      },
      () => set(p => ({ locating: false, error: p.me ? p.error : 'Activa tu ubicación para pedir un taxi' })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [set])

  // ── Spots para buscar y tocar en el mapa ──
  useEffect(() => { spotsService.getSpots().then(spots => set({ spots })).catch(() => {}) }, [set])

  // ── Autos libres cerca (cada 5 s mientras no hay viaje asignado) ──
  const stage = s.stage
  useEffect(() => {
    if (stage === 'on_the_way' || stage === 'completed') return
    const tick = () => {
      const at = ref.current.ride ? pickupOf(ref.current.ride) : ref.current.me
      if (at) taxiService.nearbyDrivers(at).then(d => set({ nearbyDrivers: d })).catch(() => {})
    }
    tick()
    const t = setInterval(tick, 5000)
    return () => clearInterval(t)
  }, [stage, set])

  // ── Viaje ──

  const stopRideJobs = useCallback(() => {
    if (jobs.current.offers) clearInterval(jobs.current.offers)
    jobs.current.unwatch?.()
    jobs.current = {}
    motion.current.last = null
    follower.current = { to: null, from: null, at: 0 }
  }, [])

  const refreshDriverRoute = useCallback(() => {
    const st = ref.current
    const ride = st.ride
    const from = st.driverLocation
    if (!ride || !from) return
    const to = ride.status === 'in_progress' ? dropoffOf(ride) : pickupOf(ride)
    const f = follower.current
    const changedDest = !f.to || distanceM(f.to, to) > 1
    const moved = !f.from || distanceM(f.from, from) > 200
    if (!changedDest && !moved && Date.now() - f.at < 30_000) return
    follower.current = { to, from, at: Date.now() }
    taxiService.route(from, to).then(r => {
      if (r) set({ driverPath: toPath(r.points), driverRouteMinutes: r.duration_min })
    })
  }, [set])

  const refreshOffers = useCallback((rideId: string) => {
    taxiService.rideOffers(rideId).then(offers => set({ offers })).catch(() => {})
  }, [set])

  const applyRide = useCallback((incoming: Ride) => {
    const prev = ref.current
    // Realtime trae la fila sin el conductor embebido: se conserva el que ya teníamos.
    const ride = !incoming.driver && prev.ride?.driver ? { ...incoming, driver: prev.ride.driver } : incoming
    const stage: Stage =
      ride.status === 'requested' ? 'waiting'
        : ride.status === 'completed' ? 'completed'
          : ride.status === 'cancelled' || ride.status === 'expired' ? 'setup'
            : 'on_the_way'
    const ended = ride.status === 'cancelled' || ride.status === 'expired'
    set(p => ({
      ride: ended ? null : ride,
      stage,
      busy: false,
      dropoff: ended ? p.dropoff : dropoffOf(ride),
      dropoffAddress: ended ? p.dropoffAddress : ride.dropoff_address ?? p.dropoffAddress,
      error: ride.status === 'expired' ? 'Nadie aceptó a tiempo. Prueba subiendo tu oferta.'
        : ride.status === 'cancelled' ? 'El viaje fue cancelado.' : p.error,
    }))

    // Un solo canal en vivo por viaje: estado, GPS del conductor y ofertas.
    if (!ended && stage !== 'completed' && jobs.current.watchedRide !== ride.id) {
      jobs.current.unwatch?.()
      jobs.current.watchedRide = ride.id
      jobs.current.unwatch = taxiService.watchRide(ride.id, {
        ride: r => applyRideRef.current(r),
        offer: () => refreshOffers(ride.id),
        location: loc => {
          if (loc.actor !== 'driver') return
          const at = { lat: loc.lat, lng: loc.lng }
          const last = motion.current.last
          const moving = !!last && distanceM(last, at) >= 10
          const heading = loc.heading ?? (last && moving ? bearing(last, at) : ref.current.driverHeading)
          if (!last || moving) motion.current.last = at
          set({ driverLocation: at, driverHeading: heading, driverMoving: moving })
          refreshDriverRoute()
        },
      })
    }

    // Ruta del viaje (al reabrir con un pedido en curso no hay ruta guardada).
    if (!ended && ref.current.routePath.length === 0) {
      taxiService.route(pickupOf(ride), dropoffOf(ride)).then(r => {
        if (r) set({ routePath: toPath(r.points), routeKm: r.distance_km, routeMinutes: r.duration_min })
      })
    }

    if (stage === 'waiting') {
      if (!jobs.current.offers) {
        refreshOffers(ride.id)
        // Refresco cada 5 s para quitar las vencidas, además del aviso en vivo.
        jobs.current.offers = setInterval(() => refreshOffers(ride.id), 5000)
      }
    } else if (stage === 'on_the_way') {
      if (jobs.current.offers) { clearInterval(jobs.current.offers); jobs.current.offers = undefined }
      set({ offers: [], nearbyDrivers: [] })
      refreshDriverRoute()
      if (ride.status !== 'in_progress' && !ref.current.pin) {
        taxiService.boardingPin(ride.id).then(pin => set({ pin })).catch(() => {})
      }
      if (!ride.driver) {
        taxiService.activeRide().then(a => { if (a?.driver) set(p => ({ ride: p.ride && { ...p.ride, driver: a.driver } })) }).catch(() => {})
      }
    } else {
      stopRideJobs()
    }
  }, [set, refreshOffers, refreshDriverRoute, stopRideJobs])
  useLayoutEffect(() => { applyRideRef.current = applyRide })

  // ── Al abrir: viaje en curso o destino que llegó desde un spot / itinerario ──
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    taxiService.activeRide().then(active => {
      if (active && active.role !== 'driver') applyRideRef.current(active)
      else if (initial?.dest) selectDestinationRef.current(initial.dest, initial.name ?? 'Destino', initial.spotId ?? null)
    }).catch(() => {
      if (initial?.dest) selectDestinationRef.current(initial.dest, initial.name ?? 'Destino', initial.spotId ?? null)
    })
    return () => stopRideJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Destino y cotización ──

  const selectDestination = useCallback(async (dropoff: GeoPoint, address: string, spotId: string | null) => {
    set({ dropoff, dropoffAddress: address, spotId, quote: null, busy: true, error: null, routePath: [], routeKm: null, routeMinutes: null })
    let pickup = ref.current.me
    // Si el GPS todavía no respondió, se espera un momento.
    for (let i = 0; !pickup && i < 20; i++) {
      await new Promise(r => setTimeout(r, 300))
      pickup = ref.current.me
    }
    if (!pickup) { set({ busy: false, error: 'No pudimos obtener tu ubicación' }); return }
    // Primero la ruta por calles: sus km reales hacen la tarifa más justa
    // que la línea recta. Si el servicio de rutas falla, se cotiza igual.
    const route = await taxiService.route(pickup, dropoff)
    try {
      const quote = await taxiService.quote(pickup, dropoff, route?.distance_km)
      set({
        quote, offeredFare: quote.recommended_fare, stage: 'quoted', busy: false,
        routePath: route ? toPath(route.points) : [], routeKm: route?.distance_km ?? null, routeMinutes: route?.duration_min ?? null,
      })
    } catch {
      set({ busy: false, error: 'No se pudo calcular la tarifa' })
    }
  }, [set])
  useLayoutEffect(() => { selectDestinationRef.current = selectDestination })

  const selectSpot = useCallback((spot: Spot) => selectDestination({ lat: spot.lat, lng: spot.lng }, spot.name, spot.id), [selectDestination])

  const selectSpotById = useCallback((id: string) => {
    const st = ref.current
    if (st.stage !== 'setup' && st.stage !== 'quoted') return
    const spot = st.spots.find(x => x.id === id)
    if (spot) selectSpot(spot)
  }, [selectSpot])

  /** Mantener presionado (o clic derecho) en el mapa: destino libre, sin spot. */
  const selectMapPoint = useCallback((p: GeoPoint) => {
    const st = ref.current.stage
    if (st !== 'setup' && st !== 'quoted') return
    selectDestination(p, 'Punto elegido en el mapa', null)
  }, [selectDestination])

  const changeDestination = useCallback(() => set({
    stage: 'setup', dropoff: null, dropoffAddress: '', quote: null, note: '', spotId: null,
    routePath: [], routeKm: null, routeMinutes: null,
  }), [set])

  const stepFare = useCallback((up: boolean) => set(p => {
    if (!p.quote) return {}
    return { offeredFare: Math.min(p.quote.max_fare, Math.max(p.quote.min_fare, p.offeredFare + (up ? FARE_STEP : -FARE_STEP))) }
  }), [set])

  const setFare = useCallback((amount: number) => set(p => (
    p.quote ? { offeredFare: Math.min(p.quote.max_fare, Math.max(p.quote.min_fare, amount)) } : {}
  )), [set])

  const setNote = useCallback((note: string) => set({ note: note.slice(0, 140) }), [set])
  const setQuery = useCallback((query: string) => set({ query }), [set])

  // ── Pedido ──

  const requestRide = useCallback(async () => {
    const st = ref.current
    if (!st.me || !st.dropoff) return
    set({ busy: true, error: null })
    try {
      applyRide(await taxiService.requestRide({
        pickup: st.me, dropoff: st.dropoff, dropoffAddress: st.dropoffAddress, fare: st.offeredFare,
        note: st.note.trim() || null, routeKm: st.routeKm, spotId: st.spotId,
      }))
    } catch (e) {
      set({ busy: false, error: errText(e, 'No se pudo pedir el viaje. Revisa tu conexión.') })
    }
  }, [set, applyRide])

  const raiseFare = useCallback(async () => {
    const ride = ref.current.ride
    if (!ride) return
    try { applyRide(await taxiService.raiseFare(ride.id, ride.offered_fare + 1)) } catch (e) { set({ error: errText(e, 'No se pudo subir tu oferta') }) }
  }, [set, applyRide])

  const acceptOffer = useCallback(async (offer: Offer) => {
    set({ busy: true })
    try { applyRide(await taxiService.acceptOffer(offer.id)) } catch (e) {
      set({ busy: false, error: errText(e, 'No se pudo aceptar la oferta') })
      const ride = ref.current.ride
      if (ride) refreshOffers(ride.id)
    }
  }, [set, applyRide, refreshOffers])

  const reset = useCallback(() => {
    stopRideJobs()
    set(p => ({ ...INITIAL, me: p.me, locating: false, spots: p.spots }))
  }, [set, stopRideJobs])

  const cancel = useCallback(async () => {
    const ride = ref.current.ride
    if (!ride) return
    try { await taxiService.cancel(ride.id); reset() } catch (e) { set({ error: errText(e, 'No se pudo cancelar') }) }
  }, [set, reset])

  const sos = useCallback(() => {
    const ride = ref.current.ride
    if (ride) taxiService.sos(ride.id, ref.current.me).catch(() => {})
  }, [])

  const rate = useCallback(async (stars: number, comment: string | null) => {
    const ride = ref.current.ride
    if (ride) await taxiService.rate(ride.id, stars, comment).catch(() => {})
    reset()
  }, [reset])

  const clearError = useCallback(() => set({ error: null }), [set])

  // ── Derivados ──

  const suggestions = useMemo(() => {
    const q = s.query.trim().toLowerCase()
    const base = q ? s.spots.filter(x => [x.name, x.address ?? '', x.category].some(t => t.toLowerCase().includes(q))) : s.spots
    const me = s.me
    return (me ? [...base].sort((a, b) => distanceM(me, a) - distanceM(me, b)) : base).slice(0, 12)
  }, [s.query, s.spots, s.me])

  /** Minutos que le faltan al conductor para llegar al recojo (ruta real, o estimado a 20 km/h). */
  const driverEtaMin = useMemo(() => {
    if (s.driverRouteMinutes != null) return s.driverRouteMinutes
    if (!s.driverLocation || !s.ride) return null
    return Math.max(1, Math.round(distanceM(s.driverLocation, pickupOf(s.ride)) * 1.35 / 1000 / 20 * 60))
  }, [s.driverRouteMinutes, s.driverLocation, s.ride])

  /** Duración del viaje (ruta real, o estimado a 22 km/h). */
  const tripMinutes = s.routeMinutes ?? (s.quote ? Math.max(1, Math.round(s.quote.distance_km / 22 * 60)) : null)

  return {
    s, suggestions, driverEtaMin, tripMinutes,
    setQuery, selectSpot, selectSpotById, selectMapPoint, changeDestination, stepFare, setFare, setNote,
    requestRide, raiseFare, acceptOffer, cancel, sos, rate, finish: reset, clearError,
    shareUrl: () => (s.ride ? taxiService.shareUrl(s.ride) : null),
  }
}
