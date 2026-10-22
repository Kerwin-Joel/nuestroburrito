import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowLeft, Car, Check, ChevronRight, Crosshair, Hand, Minus, Plus, Search, Share2, Shield, ShieldCheck, Star, X,
} from 'lucide-react'
import TaxiMap, { MAX_3D_BURRITOS, type TaxiMapContent } from './taxi/TaxiMap'
import { usePassengerTaxi, type Stage } from './taxi/usePassengerTaxi'
import { distanceM, formatDistance, money, pickupOf, type BoardingConfidence, type DriverPublic, type Offer, type Ride } from '../../services/taxi'
import type { Spot } from '../../types/spot'
import './taxi/taxi.css'

/**
 * Taxi Burrito para el pasajero en la web — espejo de TaxiScreen.kt (modo
 * Viajar). Mapa a pantalla completa, panel inferior que se arrastra y las
 * mismas etapas: destino → oferta → buscando → en viaje → calificar.
 * Manejar (modo conductor) queda en la app: necesita GPS en segundo plano.
 */

const CATEGORY_EMOJI: Record<string, string> = {
  playa: '🏖️', gastronomia: '🍽️', cultura: '🎨', sierra: '🏔️', aventura: '🌊', mercados: '🛍️', relax: '☕', hoteles: '🏨',
}

export default function TaxiPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Destino que llega desde un spot o una parada del día (solo al abrir).
  const [initial] = useState(() => {
    const lat = parseFloat(params.get('lat') ?? '')
    const lng = parseFloat(params.get('lng') ?? '')
    return isFinite(lat) && isFinite(lng)
      ? { dest: { lat, lng }, name: params.get('name') ?? undefined, spotId: params.get('spot') ?? undefined }
      : undefined
  })
  const t = usePassengerTaxi(initial)
  const { s } = t

  const [sheetH, setSheetH] = useState(0)
  const [topH, setTopH] = useState(0)
  const [recenter, setRecenter] = useState(0)
  const [driveNote, setDriveNote] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      setSheetH(sheetRef.current?.offsetHeight ?? 0)
      setTopH(topRef.current ? topRef.current.getBoundingClientRect().bottom : 0)
    })
    if (sheetRef.current) ro.observe(sheetRef.current)
    if (topRef.current) ro.observe(topRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Panel plegable: sigue al dedo y se acomoda con un resorte al soltar ──
  const y = useMotionValue(0)
  const drag = useDragControls()
  const peek = s.stage === 'setup' ? 178 : 124
  const maxOff = Math.max(0, sheetH - peek)
  const settleTo = (target: number, velocity = 0) =>
    animate(y, target, { type: 'spring', stiffness: 420, damping: 38, velocity })
  const settle = (velocity: number) => {
    const target = velocity > 500 ? maxOff : velocity < -500 ? 0 : y.get() > maxOff / 2 ? maxOff : 0
    settleTo(target, velocity)
  }
  // Cada etapa nueva abre el panel.
  useEffect(() => { settleTo(0) }, [s.stage]) // eslint-disable-line react-hooks/exhaustive-deps
  // El botón "mi ubicación" va justo encima del panel, cuadro a cuadro.
  const fabBottom = useTransform(y, v => sheetH - v + 12)

  const content = useMemo(() => mapContent(s), [s])

  return (
    <div className="tx-root">
      <TaxiMap
        content={content} sheetHeight={sheetH} topInset={topH} recenterSignal={recenter}
        onLongPress={t.selectMapPoint} onSpotTap={(spot: Spot) => t.selectSpotById(spot.id)}
      />

      {/* ── Barra superior flotante ── */}
      <div ref={topRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: 'calc(10px + env(safe-area-inset-top)) 16px 10px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          <button className="tx-circle-btn tx-float" onClick={() => navigate(-1)} aria-label="Atrás"><ArrowLeft size={22} /></button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <RoleSwitch onDrive={() => setDriveNote(true)} />
          </div>
          <div style={{ width: 46 }} />
        </div>
        <AnimatePresence>
          {s.error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginTop: 10, pointerEvents: 'auto' }}>
              <div className="tx-toast">
                <span style={{ flex: 1 }}>{s.error}</span>
                <button onClick={t.clearError} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} color="rgba(255,255,255,.7)" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {s.stage === 'setup' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <div className="tx-float" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
              <Car size={16} color={s.nearbyDrivers.length ? 'var(--tx-orange)' : 'var(--tx-muted)'} />
              {s.nearbyDrivers.length === 0 ? 'Sin conductores cerca por ahora' : s.nearbyDrivers.length === 1 ? '1 conductor cerca' : `${s.nearbyDrivers.length} conductores cerca`}
            </div>
          </div>
        )}
      </div>

      {/* ── Botón "mi ubicación" ── */}
      <motion.button
        className="tx-circle-btn tx-float" aria-label="Mi ubicación" onClick={() => setRecenter(r => r + 1)}
        style={{ position: 'absolute', right: 16, bottom: fabBottom, zIndex: 999 }}
      >
        <Crosshair size={22} />
      </motion.button>

      {/* ── Panel inferior ── */}
      <motion.div
        ref={sheetRef} className="tx-sheet" style={{ y }}
        drag="y" dragListener={false} dragControls={drag} dragMomentum={false}
        dragConstraints={{ top: 0, bottom: maxOff }} dragElastic={{ top: 0.04, bottom: 0.1 }}
        onDragEnd={(_, info) => settle(info.velocity.y)}
      >
        <div
          className="tx-handle" onPointerDown={e => drag.start(e)}
          onClick={() => settleTo(y.get() > 0 ? 0 : maxOff)}
        ><span /></div>
        <div className="tx-body">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={s.stage}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <StageView stage={s.stage} t={t} onExpand={() => settleTo(0)} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {driveNote && (
        <div className="tx-modal-bg" onClick={() => setDriveNote(false)}>
          <div className="tx-modal" onClick={e => e.stopPropagation()}>
            <h3 className="tx-title">Maneja con Burrito</h3>
            <p className="tx-sub" style={{ fontSize: 14, lineHeight: '20px' }}>
              Para manejar necesitas la app de Burrito en tu celular Android: ahí se registra tu auto y tu ubicación se comparte durante todo el viaje, aunque apagues la pantalla.
            </p>
            <button className="tx-primary" style={{ marginTop: 18 }} onClick={() => setDriveNote(false)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

type Taxi = ReturnType<typeof usePassengerTaxi>

function StageView({ stage, t, onExpand }: { stage: Stage; t: Taxi; onExpand: () => void }) {
  switch (stage) {
    case 'setup': return <DestinationPicker t={t} onExpand={onExpand} />
    case 'quoted': return <QuoteAndOffer t={t} />
    case 'waiting': return <SearchingDriver t={t} />
    case 'on_the_way': return <TripInProgress t={t} />
    case 'completed': return <RateTrip t={t} />
  }
}

// ============================================================ contenido del mapa

function mapContent(s: Taxi['s']): TaxiMapContent {
  // Los más cercanos van como Burrito Chevy 3D; el resto, como pin (ver MAX_3D_BURRITOS).
  const free = s.nearbyDrivers.slice(0, MAX_3D_BURRITOS).map((d, i) => ({ key: `free-${i}`, at: { lat: d.lat, lng: d.lng }, heading: d.heading, moving: d.moving }))
  const cars = s.nearbyDrivers.slice(MAX_3D_BURRITOS).map(d => ({ at: { lat: d.lat, lng: d.lng } }))
  // Spots tocables (el que ya es destino lo tapa su propio pin).
  const spots = s.spots.filter(x => !s.dropoff || x.lat !== s.dropoff.lat || x.lng !== s.dropoff.lng)
  const ride = s.ride
  const pair = (a: { lat: number; lng: number } | null | undefined, b: { lat: number; lng: number } | null | undefined) => (a && b ? [a, b] as [typeof a, typeof b] : null)

  switch (s.stage) {
    case 'setup': {
      // Encuadre: yo + los 4 spots más cercanos (hasta 15 km) para que se vean a la primera.
      const me = s.me
      const near = me ? s.spots.map(x => ({ lat: x.lat, lng: x.lng })).filter(p => distanceM(me, p) < 15_000)
        .sort((a, b) => distanceM(me, a) - distanceM(me, b)).slice(0, 4) : []
      return { me: s.me, cars, burritos: free, spots, cameraKey: `setup-${!!s.me}-${near.length}`, cameraPoints: [...(me ? [me] : []), ...near] }
    }
    case 'quoted':
      return {
        me: s.me, pickup: s.me, pickupLabel: 'Recojo', dropoff: s.dropoff, dropoffLabel: s.dropoffAddress,
        spots, cars, burritos: free, route: pair(s.me, s.dropoff), routePath: s.routePath,
        cameraKey: `quote-${s.dropoff?.lat},${s.dropoff?.lng}-${s.routePath.length}`,
        cameraPoints: [...(s.me ? [s.me] : []), ...(s.dropoff ? [s.dropoff] : []), ...s.routePath],
      }
    case 'waiting': {
      const pickup = ride ? pickupOf(ride) : s.me
      return {
        me: null, pickup, pickupLabel: 'Recojo', dropoff: s.dropoff, dropoffLabel: s.dropoffAddress,
        cars, burritos: free, route: pair(pickup, s.dropoff), routePath: s.routePath, pulseAt: pickup,
        cameraKey: `wait-${ride?.id}-${s.routePath.length > 0}`,
        cameraPoints: [...(pickup ? [pickup] : []), ...(s.dropoff ? [s.dropoff] : []), ...s.routePath],
      }
    }
    case 'on_the_way': {
      const hero = s.driverLocation ? [{ key: 'hero', at: s.driverLocation, heading: s.driverHeading, moving: s.driverMoving, hero: true }] : []
      const pickup = ride ? pickupOf(ride) : null
      if (ride?.status === 'in_progress') {
        const path = s.driverPath.length ? s.driverPath : s.routePath
        const from = s.driverLocation ?? pickup
        return {
          me: null, dropoff: s.dropoff, dropoffLabel: s.dropoffAddress, burritos: hero,
          route: pair(from, s.dropoff), routePath: path,
          cameraKey: `trip-${!!s.driverLocation}-${path.length > 0}`,
          cameraPoints: [...(from ? [from] : []), ...(s.dropoff ? [s.dropoff] : []), ...path],
        }
      }
      return {
        me: s.me, pickup, pickupLabel: 'Recojo', burritos: hero,
        route: pair(s.driverLocation, pickup), routePath: s.driverPath,
        cameraKey: `coming-${ride?.status}-${!!s.driverLocation}-${s.driverPath.length > 0}`,
        cameraPoints: [...(s.driverLocation ? [s.driverLocation] : []), ...(pickup ? [pickup] : []), ...s.driverPath],
      }
    }
    case 'completed':
      return { me: null, dropoff: s.dropoff, dropoffLabel: s.dropoffAddress, cameraKey: 'done', cameraPoints: s.dropoff ? [s.dropoff] : [] }
  }
}

// ============================================================ etapas

function DestinationPicker({ t, onExpand }: { t: Taxi; onExpand: () => void }) {
  const { s } = t
  const list = t.suggestions
  return (
    <>
      <h2 className="tx-title">¿A dónde vamos?</h2>
      <p className="tx-sub">{s.locating ? 'Ubicándote…' : 'Toca un spot en el mapa o búscalo aquí'}</p>
      <div style={{ height: 14 }} />
      <div className="tx-search">
        <Search size={20} color="var(--tx-gray)" />
        <input value={s.query} onChange={e => t.setQuery(e.target.value)} onFocus={onExpand} placeholder="Busca un spot, playa, restaurante…" />
        {s.query && <button onClick={() => t.setQuery('')} aria-label="Borrar" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} color="var(--tx-gray)" /></button>}
      </div>
      <div className="tx-hint">
        <Hand size={18} color="var(--tx-orange)" style={{ flexShrink: 0 }} />
        Toca un spot del mapa para ir ahí, o mantén presionado cualquier otro punto
      </div>
      <div style={{ height: 10 }} />
      {s.busy && <div className="tx-progress indeterminate"><div /></div>}
      {list.length === 0 && s.spots.length > 0 && (
        <p style={{ color: 'var(--tx-muted)', fontSize: 13, padding: '14px 0', margin: 0 }}>Ningún spot coincide con "{s.query}"</p>
      )}
      {list.map(spot => (
        <button key={spot.id} className="tx-row" onClick={() => t.selectSpot(spot)}>
          <span className="tx-thumb">
            {spot.photoUrl ? <img src={spot.photoUrl} alt="" loading="lazy" /> : CATEGORY_EMOJI[spot.category] ?? '📍'}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: 'var(--tx-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name.trim()}</span>
            <span style={{ display: 'block', fontSize: 12.5, color: 'var(--tx-muted)' }}>
              {[spot.category.charAt(0).toUpperCase() + spot.category.slice(1), s.me && formatDistance(distanceM(s.me, spot))].filter(Boolean).join(' · ')}
            </span>
          </span>
          <ChevronRight size={20} color="var(--tx-muted)" />
        </button>
      ))}
    </>
  )
}

function QuoteAndOffer({ t }: { t: Taxi }) {
  const { s } = t
  const q = s.quote
  const [showNote, setShowNote] = useState(s.note.length > 0)
  if (!q) return null
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 className="tx-title" style={{ flex: 1 }}>Tu viaje</h2>
        <button onClick={t.changeDestination} style={{ background: 'none', border: 'none', color: 'var(--tx-orange)', font: '600 14px var(--font-body)', cursor: 'pointer', padding: 8 }}>Cambiar</button>
      </div>
      <RouteSummary from="Tu ubicación" to={s.dropoffAddress} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <span className="tx-chip">{q.distance_km.toFixed(1)} km</span>
        {t.tripMinutes != null && <span className="tx-chip">~{t.tripMinutes} min</span>}
        <span className="tx-chip">Pagas al conductor</span>
      </div>

      {/* Negociación estilo InDrive */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
        <button className="tx-step" disabled={s.offeredFare <= q.min_fare} onClick={() => t.stepFare(false)} aria-label="Bajar"><Minus size={22} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={s.offeredFare} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: 'var(--tx-ink)', whiteSpace: 'nowrap' }}>
              S/ {money(s.offeredFare)}
            </motion.div>
          </AnimatePresence>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>tu oferta</div>
        </div>
        <button className="tx-step" disabled={s.offeredFare >= q.max_fare} onClick={() => t.stepFare(true)} aria-label="Subir"><Plus size={22} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <button className={`tx-fare-chip ${s.offeredFare === q.recommended_fare ? 'on' : ''}`} onClick={() => t.setFare(q.recommended_fare)}>Recomendado S/ {money(q.recommended_fare)}</button>
        <button className={`tx-fare-chip ${s.offeredFare === q.recommended_fare + 1 ? 'on' : ''}`} onClick={() => t.setFare(q.recommended_fare + 1)}>+ S/ 1</button>
        <button className={`tx-fare-chip ${s.offeredFare === q.recommended_fare + 2 ? 'on' : ''}`} onClick={() => t.setFare(q.recommended_fare + 2)}>+ S/ 2</button>
      </div>
      {showNote ? (
        <input className="tx-field" style={{ marginTop: 12 }} value={s.note} onChange={e => t.setNote(e.target.value)} placeholder="Ej. estoy en la puerta del hotel" autoFocus />
      ) : (
        <button className="tx-text-btn" onClick={() => setShowNote(true)}>+ Agregar nota para el conductor</button>
      )}
      <div style={{ height: 8 }} />
      <button className="tx-primary" disabled={s.busy} onClick={t.requestRide}>
        {s.busy ? <span className="tx-spinner" /> : `Buscar conductor · S/ ${money(s.offeredFare)}`}
      </button>
    </>
  )
}

function SearchingDriver({ t }: { t: Taxi }) {
  const { s } = t
  const ride = s.ride
  if (!ride) return null
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="tx-dot" />
        <h2 className="tx-title">{s.offers.length === 0 ? 'Buscando conductores' : 'Elige a tu conductor'}</h2>
      </div>
      <div className="tx-progress indeterminate" style={{ marginTop: 10 }}><div /></div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, padding: 14, borderRadius: 16, background: 'rgba(245,237,216,.6)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Tu oferta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>S/ {money(ride.offered_fare)}</div>
        </div>
        <button onClick={t.raiseFare} style={{ border: '1.5px solid var(--tx-orange)', borderRadius: 99, background: 'none', color: 'var(--tx-orange)', font: '700 14px var(--font-body)', padding: '10px 16px', cursor: 'pointer' }}>Subir S/ 1</button>
      </div>
      <div style={{ height: 14 }} />
      {s.offers.length === 0 ? (
        <p style={{ color: 'var(--tx-gray)', fontSize: 13, margin: 0 }}>Los conductores cercanos están viendo tu pedido. Subir un poco tu oferta suele traer respuestas más rápido.</p>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            {s.offers.length} {s.offers.length === 1 ? 'oferta' : 'ofertas'}
          </div>
          <AnimatePresence initial={false}>
            {s.offers.map(o => (
              <motion.div key={o.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 10 }}>
                <OfferCard offer={o} asked={ride.offered_fare} busy={s.busy} onAccept={() => t.acceptOffer(o)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
      <button className="tx-text-btn" style={{ color: 'var(--tx-red)' }} onClick={t.cancel}>Cancelar pedido</button>
    </>
  )
}

/** Segundos que le quedan a una oferta, refrescado cada segundo. */
function useSecondsLeft(expiresAt: string, total: number) {
  const calc = () => Math.max(0, Math.min(total, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)))
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [expiresAt]) // eslint-disable-line react-hooks/exhaustive-deps
  return left
}

function OfferCard({ offer, asked, busy, onAccept }: { offer: Offer; asked: number; busy: boolean; onAccept: () => void }) {
  const d = offer.driver
  const left = useSecondsLeft(offer.expires_at, 60)
  return (
    <div className="tx-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={d?.name ?? '?'} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{d?.name.split(' ')[0] ?? 'Conductor'}</div>
          {d && <Rating avg={d.rating_avg} count={d.rating_count} />}
          <div style={{ fontSize: 12.5, color: 'var(--tx-muted)' }}>{d?.vehicle_model} · {d?.vehicle_color}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>S/ {money(offer.amount)}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{offer.eta_min} min · {formatDistance(offer.distance_to_pickup_m)}</div>
        </div>
      </div>
      {offer.amount > asked && (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#B85C00' }}>Contraoferta: +S/ {money(offer.amount - asked)} sobre tu precio</div>
      )}
      <div className="tx-progress" style={{ marginTop: 10 }}>
        <div style={{ width: `${(left / 60) * 100}%`, background: left < 15 ? 'var(--tx-red)' : undefined }} />
      </div>
      <button className="tx-primary" style={{ height: 48, marginTop: 10 }} disabled={busy} onClick={onAccept}>
        {busy ? <span className="tx-spinner" /> : `Aceptar · S/ ${money(offer.amount)}`}
      </button>
    </div>
  )
}

function TripInProgress({ t }: { t: Taxi }) {
  const { s } = t
  const ride = s.ride
  const [sosOpen, setSosOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  if (!ride) return null
  const title = ride.status === 'accepted' ? (t.driverEtaMin != null ? `Llega en ~${t.driverEtaMin} min` : 'Tu conductor viene en camino')
    : ride.status === 'arrived' ? 'Tu conductor llegó' : 'En camino a tu destino'
  const sub = ride.status === 'arrived' ? 'Búscalo en el punto de recojo y dale tu código'
    : ride.status === 'in_progress' ? s.dropoffAddress : 'Ten a la mano tu código de abordaje'

  const share = async () => {
    const url = t.shareUrl()
    if (!url) return
    const text = `Sigue mi viaje en Burrito en tiempo real: ${url}`
    if (navigator.share) { navigator.share({ title: 'Mi viaje en Burrito', text }).catch(() => {}) }
    else { await navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2500) }
  }

  return (
    <>
      <h2 className="tx-title">{title}</h2>
      <p className="tx-sub">{sub}</p>
      <div style={{ height: 14 }} />
      <TripSteps status={ride.status} />
      <div style={{ height: 16 }} />
      {ride.driver && <DriverCard driver={ride.driver} fare={ride.final_fare ?? ride.offered_fare} />}
      {(ride.status === 'accepted' || ride.status === 'arrived') && (
        <>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 16 }}>Dile este código al conductor</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="tx-pin-box">{s.pin?.[i] ?? '•'}</div>)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--tx-muted)', margin: '6px 0 0' }}>Antes de subir, verifica que el modelo, color y placa coincidan.</p>
        </>
      )}
      {ride.status === 'in_progress' && <BoardingBanner confidence={ride.boarding_confidence} onHelp={() => setSosOpen(true)} />}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', marginTop: 18 }}>
        <button className="tx-action" onClick={share}><span><Share2 size={23} /></span>{copied ? '¡Copiado!' : 'Compartir'}</button>
        <button className="tx-action" onClick={() => setSosOpen(true)}>
          <span style={{ background: 'var(--tx-red)', color: '#fff', fontWeight: 800, fontSize: 14 }}>SOS</span>SOS
        </button>
        {ride.status !== 'in_progress' && (
          <button className="tx-action" onClick={t.cancel}><span><X size={23} color="var(--tx-gray)" /></span>Cancelar</button>
        )}
      </div>
      {sosOpen && (
        <div className="tx-modal-bg" onClick={() => setSosOpen(false)}>
          <div className="tx-modal" onClick={e => e.stopPropagation()}>
            <h3 className="tx-title">¿Necesitas ayuda?</h3>
            <p className="tx-sub" style={{ fontSize: 14, lineHeight: '20px' }}>Avisaremos al equipo de Burrito con tu ubicación y el viaje. También puedes llamar a la policía (105).</p>
            <a href="tel:105" className="tx-primary" style={{ marginTop: 18, background: 'var(--tx-red)', textDecoration: 'none' }}
              onClick={() => { t.sos(); setSosOpen(false) }}>Alertar y llamar al 105</a>
            <button className="tx-text-btn" style={{ color: 'var(--tx-ink)' }} onClick={() => { t.sos(); setSosOpen(false) }}>Solo alertar</button>
          </div>
        </div>
      )}
    </>
  )
}

function RateTrip({ t }: { t: Taxi }) {
  const ride = t.s.ride
  const [stars, setStars] = useState(5)
  const [picked, setPicked] = useState<string[]>([])
  const compliments = ['Amable', 'Auto limpio', 'Buena ruta', 'Puntual', 'Manejo seguro']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,158,91,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--tx-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={26} color="#fff" /></div>
      </div>
      <h2 className="tx-title" style={{ marginTop: 12 }}>¡Llegaste!</h2>
      <p className="tx-sub" style={{ fontSize: 13 }}>{t.s.dropoffAddress}</p>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, marginTop: 14 }}>S/ {money(ride?.final_fare ?? ride?.offered_fare ?? 0)}</div>
      <div style={{ fontSize: 12.5, color: 'var(--tx-muted)' }}>Págale al conductor en efectivo, Yape o Plin</div>
      <div style={{ fontWeight: 600, marginTop: 18 }}>¿Cómo estuvo {ride?.driver?.name.split(' ')[0] ?? 'tu conductor'}?</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <motion.button key={i} whileTap={{ scale: 0.85 }} animate={{ scale: i <= stars ? 1 : 0.85 }} onClick={() => setStars(i)}
            aria-label={`${i} estrellas`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Star size={42} fill={i <= stars ? 'var(--tx-yellow)' : 'var(--tx-border-hover)'} color={i <= stars ? 'var(--tx-yellow)' : 'var(--tx-border-hover)'} />
          </motion.button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        {compliments.map(c => (
          <button key={c} className={`tx-fare-chip ${picked.includes(c) ? 'on' : ''}`} onClick={() => setPicked(p => (p.includes(c) ? p.filter(x => x !== c) : [...p, c]))}>{c}</button>
        ))}
      </div>
      <button className="tx-primary" style={{ marginTop: 18 }} onClick={() => t.rate(stars, picked.join(', ') || null)}>Enviar calificación</button>
      <button className="tx-text-btn" style={{ color: 'var(--tx-muted)' }} onClick={t.finish}>Omitir</button>
    </div>
  )
}

// ============================================================ piezas

function RoleSwitch({ onDrive }: { onDrive: () => void }) {
  return (
    <div className="tx-float" style={{ display: 'flex', padding: 4, borderRadius: 99 }}>
      <span style={{ padding: '9px 18px', borderRadius: 99, background: 'var(--tx-ink)', color: '#fff', fontWeight: 700, fontSize: 14 }}>Viajar</span>
      <button onClick={onDrive} style={{ padding: '9px 18px', borderRadius: 99, background: 'none', border: 'none', color: 'var(--tx-gray)', font: '700 14px var(--font-body)', cursor: 'pointer' }}>Conducir</button>
    </div>
  )
}

/** Origen (círculo verde) → destino (cuadrado negro), como Uber. */
function RouteSummary({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ display: 'flex', marginTop: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', border: '3px solid var(--tx-green)' }} />
        <span style={{ width: 2, height: 18, background: 'var(--tx-border-hover)' }} />
        <span style={{ width: 11, height: 11, borderRadius: 2, background: 'var(--tx-ink)' }} />
      </div>
      <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, padding: '4px 0', borderBottom: '1px solid var(--tx-border)' }}>{from}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, padding: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{to.trim()}</div>
      </div>
    </div>
  )
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #F5A623, #E8920A, #B85C00)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.42,
    }}>{name.trim().charAt(0).toUpperCase() || '?'}</div>
  )
}

function Rating({ avg, count }: { avg: number; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5 }}>
      <Star size={14} fill="var(--tx-yellow)" color="var(--tx-yellow)" />
      <span style={{ fontWeight: 600 }}>{Number(avg).toFixed(1)}</span>
      <span style={{ color: 'var(--tx-muted)', fontSize: 12 }}>({count})</span>
    </div>
  )
}

/** Placa estilo peruana: blanca, borde negro, "PERÚ" arriba. */
function PlateBadge({ plate }: { plate: string }) {
  return (
    <div style={{ borderRadius: 8, background: '#fff', border: '2px solid var(--tx-ink)', padding: '4px 12px', textAlign: 'center', flexShrink: 0 }}>
      <div style={{ fontSize: 7, fontWeight: 700, color: '#1E5AA8', letterSpacing: 1 }}>PERÚ</div>
      <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 18, letterSpacing: 1.5 }}>{plate}</div>
    </div>
  )
}

function DriverCard({ driver, fare }: { driver: DriverPublic; fare: number }) {
  return (
    <div className="tx-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name={driver.name} size={54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{driver.name.split(' ')[0]}</div>
        <Rating avg={driver.rating_avg} count={driver.rating_count} />
        <div style={{ fontSize: 12.5, color: 'var(--tx-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.vehicle_model} · {driver.vehicle_color}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>S/ {money(fare)}</div>
      </div>
      <PlateBadge plate={driver.vehicle_plate} />
    </div>
  )
}

/** Asignado → Llegó → En viaje. */
function TripSteps({ status }: { status: Ride['status'] }) {
  const current = status === 'accepted' ? 0 : status === 'arrived' ? 1 : status === 'in_progress' ? 2 : 3
  const labels = ['En camino', 'Llegó', 'En viaje']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {labels.map((label, i) => {
        const done = i < current
        const now = i === current
        const color = done ? 'var(--tx-green)' : now ? 'var(--tx-orange)' : 'var(--tx-border-hover)'
        return (
          <div key={label} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .3s' }}>
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span style={{ fontSize: 11.5, marginTop: 4, color: now ? 'var(--tx-ink)' : 'var(--tx-muted)', fontWeight: now ? 700 : 400 }}>{label}</span>
            </div>
            {i < labels.length - 1 && <span style={{ flex: 1, height: 2, margin: '10px 6px 0', background: i < current ? 'var(--tx-green)' : 'var(--tx-border-hover)', transition: 'background .3s' }} />}
          </div>
        )
      })}
    </div>
  )
}

function BoardingBanner({ confidence, onHelp }: { confidence: BoardingConfidence; onHelp: () => void }) {
  const cfg = {
    pending: { bg: 'var(--tx-card2)', fg: 'var(--tx-gray)', text: 'Verificando que vas a bordo…' },
    confirmed: { bg: 'rgba(46,158,91,.12)', fg: 'var(--tx-green)', text: 'Viaje verificado · vas con tu conductor' },
    unverified: { bg: 'var(--tx-card2)', fg: 'var(--tx-gray)', text: 'No pudimos verificar el viaje con tu GPS' },
    suspicious: { bg: 'rgba(209,75,58,.10)', fg: 'var(--tx-red)', text: '¿No subiste al auto? Si algo está mal, pide ayuda.' },
  }[confidence]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: 12, borderRadius: 14, background: cfg.bg }}>
      {confidence === 'pending' ? <span className="tx-spinner dark" />
        : confidence === 'confirmed' ? <ShieldCheck size={18} color={cfg.fg} /> : <Shield size={18} color={cfg.fg} />}
      <span style={{ flex: 1, color: cfg.fg, fontSize: 13, fontWeight: 600 }}>{cfg.text}</span>
      {confidence === 'suspicious' && <button onClick={onHelp} style={{ background: 'none', border: 'none', color: 'var(--tx-red)', fontWeight: 700, cursor: 'pointer' }}>Ayuda</button>}
    </div>
  )
}
