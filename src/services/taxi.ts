import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Taxi Burrito para el pasajero en la web — espejo de taxi/TaxiRepository.kt
 * y TaxiModels.kt (app nativa). Toda escritura pasa por las RPC taxi_*; las
 * tablas son de solo lectura para el cliente.
 */

export type RideStatus = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'expired'
export type BoardingConfidence = 'pending' | 'confirmed' | 'suspicious' | 'unverified'

export interface GeoPoint { lat: number; lng: number }

export interface Quote {
  distance_km: number
  recommended_fare: number
  min_fare: number
  max_fare: number
  currency: string
}

export interface DriverPublic {
  id: string
  name: string
  photo_url: string | null
  vehicle_plate: string
  vehicle_model: string
  vehicle_color: string
  rating_avg: number
  rating_count: number
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id: string | null
  status: RideStatus
  pickup_lat: number
  pickup_lng: number
  pickup_address: string | null
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address: string | null
  distance_km: number
  recommended_fare: number
  offered_fare: number
  final_fare: number | null
  boarding_confidence: BoardingConfidence
  share_token: string | null
  expires_at: string | null
  driver?: DriverPublic | null
  role?: 'passenger' | 'driver' | null
}

export interface Offer {
  id: string
  amount: number
  eta_min: number
  distance_to_pickup_m: number
  expires_at: string
  driver: DriverPublic | null
}

export interface NearbyDriver { lat: number; lng: number; heading: number | null; moving: boolean }

export interface RouteResult { distance_km: number; duration_min: number; points: [number, number][] }

export interface RideLocation {
  ride_id: string
  actor: 'passenger' | 'driver'
  lat: number
  lng: number
  heading: number | null
  recorded_at: string
}

export const pickupOf = (r: Ride): GeoPoint => ({ lat: r.pickup_lat, lng: r.pickup_lng })
export const dropoffOf = (r: Ride): GeoPoint => ({ lat: r.dropoff_lat, lng: r.dropoff_lng })

const MESSAGES: Record<string, string> = {
  FARE_OUT_OF_RANGE: 'La tarifa está fuera del rango permitido.',
  ACTIVE_RIDE_EXISTS: 'Ya tienes un viaje en curso.',
  RIDE_NOT_AVAILABLE: 'Este pedido ya no está disponible.',
  OFFER_EXPIRED: 'La oferta venció. Elige otra.',
  DRIVER_BUSY: 'El conductor acaba de tomar otro viaje.',
  LOCATION_STALE: 'Activa tu GPS para continuar.',
  PIN_NOT_AVAILABLE: 'El código aparecerá cuando un conductor acepte tu viaje.',
  CANNOT_CANCEL: 'Este viaje ya no se puede cancelar.',
  UNAUTHENTICATED: 'Inicia sesión para continuar.',
  CANNOT_RATE: 'Este viaje no se puede calificar.',
  ALREADY_RATED: 'Ya calificaste este viaje.',
}

export class TaxiError extends Error {}

async function rpc<T>(fn: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) {
    const code = /TAXI:([A-Z_]+)/.exec(`${error.message} ${error.details ?? ''}`)?.[1]
    throw new TaxiError(code ? MESSAGES[code] ?? `Algo salió mal (${code}).` : 'No se pudo completar. Revisa tu conexión.')
  }
  return data as T
}

export const taxiService = {
  quote: (pickup: GeoPoint, dropoff: GeoPoint, routeKm?: number | null) =>
    rpc<Quote>('taxi_quote', {
      p_pickup_lat: pickup.lat, p_pickup_lng: pickup.lng,
      p_dropoff_lat: dropoff.lat, p_dropoff_lng: dropoff.lng,
      ...(routeKm != null ? { p_route_km: routeKm } : {}),
    }),

  requestRide: (a: {
    pickup: GeoPoint; dropoff: GeoPoint; dropoffAddress: string; fare: number
    note?: string | null; routeKm?: number | null; spotId?: string | null
  }) => rpc<Ride>('taxi_request_ride', {
    p_pickup_lat: a.pickup.lat, p_pickup_lng: a.pickup.lng, p_pickup_address: 'Mi ubicación',
    p_dropoff_lat: a.dropoff.lat, p_dropoff_lng: a.dropoff.lng, p_dropoff_address: a.dropoffAddress,
    p_offered_fare: a.fare,
    ...(a.note ? { p_note: a.note } : {}),
    ...(a.routeKm != null ? { p_route_km: a.routeKm } : {}),
    ...(a.spotId ? { p_spot_id: a.spotId } : {}),
  }),

  raiseFare: (rideId: string, fare: number) => rpc<Ride>('taxi_raise_fare', { p_ride_id: rideId, p_new_fare: fare }),
  rideOffers: (rideId: string) => rpc<Offer[]>('taxi_ride_offers', { p_ride_id: rideId }),
  acceptOffer: (offerId: string) => rpc<Ride>('taxi_accept_offer', { p_offer_id: offerId }),
  boardingPin: (rideId: string) => rpc<string>('taxi_get_boarding_pin', { p_ride_id: rideId }),
  activeRide: () => rpc<Ride | null>('taxi_active_ride'),
  cancel: (rideId: string) => rpc<Ride>('taxi_cancel_ride', { p_ride_id: rideId, p_reason: 'Cancelado por el pasajero' }),
  sos: (rideId: string, at: GeoPoint | null) =>
    rpc<number>('taxi_sos', { p_ride_id: rideId, ...(at ? { p_lat: at.lat, p_lng: at.lng } : {}) }),
  rate: (rideId: string, stars: number, comment?: string | null) =>
    rpc<void>('taxi_rate_ride', { p_ride_id: rideId, p_stars: stars, ...(comment ? { p_comment: comment } : {}) }),
  nearbyDrivers: (at: GeoPoint) => rpc<NearbyDriver[]>('taxi_nearby_drivers', { p_lat: at.lat, p_lng: at.lng }),

  /** GPS del pasajero durante el viaje: sirve para validar que va en el auto. */
  track: (lat: number, lng: number, accuracy?: number | null, speed?: number | null, heading?: number | null) =>
    rpc('taxi_track_location', {
      p_lat: lat, p_lng: lng,
      ...(accuracy != null ? { p_accuracy_m: accuracy } : {}),
      ...(speed != null ? { p_speed_mps: speed } : {}),
      ...(heading != null ? { p_heading: heading } : {}),
    }),

  /** Ruta real por calles (Edge Function taxi-ruta); null si no responde. */
  async route(from: GeoPoint, to: GeoPoint): Promise<RouteResult | null> {
    const { data, error } = await supabase.functions.invoke('taxi-ruta', { body: { from, to } })
    return error ? null : (data as RouteResult)
  },

  shareUrl: (r: Ride) => (r.share_token ? `${window.location.origin}/viaje/${r.share_token}` : null),

  // ── Tiempo real ──

  /** Cambios del viaje, puntos GPS y ofertas nuevas. Devuelve con qué cerrar el canal. */
  watchRide(rideId: string, on: {
    ride?: (r: Ride) => void
    location?: (l: RideLocation) => void
    offer?: () => void
  }): () => void {
    const ch: RealtimeChannel = supabase.channel(`taxi-web-${rideId}-${crypto.randomUUID()}`)
    if (on.ride) ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'taxi_rides', filter: `id=eq.${rideId}` },
      p => on.ride!(p.new as Ride))
    if (on.location) ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'taxi_ride_locations', filter: `ride_id=eq.${rideId}` },
      p => on.location!(p.new as RideLocation))
    if (on.offer) ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'taxi_offers', filter: `ride_id=eq.${rideId}` },
      () => on.offer!())
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  },
}

// ── Utilidades de geometría (espejo de MotionTracker / RouteFollower) ──

export function distanceM(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function bearing(a: GeoPoint, b: GeoPoint): number {
  const φ1 = a.lat * Math.PI / 180
  const φ2 = b.lat * Math.PI / 180
  const Δλ = (b.lng - a.lng) * Math.PI / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export const money = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2))
export const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)
