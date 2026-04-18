export const formatSoles = (amount: number): string => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatShortDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export const timeUntil = (iso: string): string => {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'Pasado'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `en ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `en ${hours} hora${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `en ${days} día${days > 1 ? 's' : ''}`
}

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export const priceRangeLabel: Record<string, string> = {
  free: 'Gratis',
  low:  'Económico',
  mid:  'Moderado',
  high: 'Premium',
}

export const statusLabel: Record<string, string> = {
  pending:   'Pendiente',
  verified:  'Verificado',
  rejected:  'Rechazado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const initials = (name: string): string =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
