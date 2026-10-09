import type { Spot } from '../types/spot'

/**
 * Chequeos de contenido de un spot: lo que un turista nota cuando falta.
 * Sirve para que el admin vea de un vistazo qué fichas están flojas.
 */
export interface SpotHealthCheck {
  id: SpotIssue
  label: string
  ok: boolean
}

export type SpotIssue =
  | 'fotos'
  | 'descripcion'
  | 'tip'
  | 'ubicacion'
  | 'horario'
  | 'precio'
  | 'redes'
  | 'videos'

export const SPOT_ISSUE_LABELS: Record<SpotIssue, string> = {
  fotos: 'Menos de 3 fotos',
  descripcion: 'Descripción corta',
  tip: 'Sin tip local',
  ubicacion: 'Sin coordenadas',
  horario: 'Sin horario',
  precio: 'Sin rango de precio',
  redes: 'Sin redes',
  videos: 'Sin TikToks',
}

// Centro por defecto del formulario: un spot que sigue ahí nunca se ubicó.
const DEFAULT_LAT = -5.1945
const DEFAULT_LNG = -80.6328

export function spotPhotos(spot: Spot): string[] {
  if (spot.photos?.length) return spot.photos
  return spot.photoUrl ? [spot.photoUrl] : []
}

export function getSpotHealth(spot: Spot): SpotHealthCheck[] {
  const hasCoords =
    Number.isFinite(spot.lat) && Number.isFinite(spot.lng) &&
    !(spot.lat === DEFAULT_LAT && spot.lng === DEFAULT_LNG) &&
    !(spot.lat === 0 && spot.lng === 0)

  const checks: Record<SpotIssue, boolean> = {
    fotos: spotPhotos(spot).length >= 3,
    descripcion: (spot.description ?? '').trim().length >= 80,
    tip: (spot.localTip ?? '').trim().length > 0,
    ubicacion: hasCoords,
    horario: Object.keys(spot.schedule ?? {}).length > 0,
    precio: !!spot.priceRange,
    redes: Object.values(spot.socialLinks ?? {}).some(Boolean),
    videos: (spot.tiktokUrls ?? []).length > 0,
  }

  return (Object.keys(checks) as SpotIssue[]).map(id => ({
    id,
    label: SPOT_ISSUE_LABELS[id],
    ok: checks[id],
  }))
}

/** 0–100: porcentaje de chequeos cumplidos. */
export function getSpotScore(spot: Spot): number {
  const checks = getSpotHealth(spot)
  return Math.round((checks.filter(c => c.ok).length / checks.length) * 100)
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}
