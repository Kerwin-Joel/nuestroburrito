export type SpotCategory =
  | 'playa'
  | 'gastronomia'
  | 'cultura'
  | 'sierra'
  | 'aventura'
  | 'mercados'
  | 'relax'
  | 'hoteles'
  // Las categorías son dinámicas (tabla `categories`, la crea el admin) —
  // este union es solo para los valores conocidos, no una lista cerrada real.
  | (string & {})

export type SpotStatus = 'pending' | 'verified' | 'rejected'

export interface SpotSocialLinks {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  website?: string
}

export interface Spot {
  id: string
  churreId: string
  name: string
  description: string
  localTip: string
  category: SpotCategory
  photoUrl: string          // main photo (backward compat)
  photos?: string[]         // carousel photos
  lat: number
  lng: number
  address: string
  schedule: Record<string, string>
  priceRange: 'free' | 'low' | 'mid' | 'high'
  status: SpotStatus
  rating: number
  reviewCount: number
  tiktokUrls: string[]
  socialLinks?: SpotSocialLinks
  createdAt: string
  eventDate: string | null
  eventDateEnd?: string | null
  /** Agrupa sedes del mismo negocio (p. ej. un hotel con varios locales). */
  brandName?: string | null
  /** QR de Yape/Plin del negocio para el checkout del catálogo. */
  paymentQrUrl?: string | null
  paymentNote?: string | null
  /** Horario del hotel — null en cualquier otro tipo de negocio. */
  checkinTime?: string | null
  checkoutTime?: string | null
}
