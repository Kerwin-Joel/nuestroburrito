/** Enlace al Taxi con un destino ya elegido (spot o parada del día) — espejo de la ruta Taxi(destLat, destLng, destName, spotId) de la app. */
export function taxiLink(dest: { lat: number; lng: number; name: string; spotId?: string | null }): string {
  const q = new URLSearchParams({ lat: String(dest.lat), lng: String(dest.lng), name: dest.name })
  if (dest.spotId) q.set('spot', dest.spotId)
  return `/app/taxi?${q.toString()}`
}
