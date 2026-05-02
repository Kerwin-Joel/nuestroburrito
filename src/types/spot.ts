export type SpotCategory =
  | 'playa'
  | 'gastronomia'
  | 'cultura'
  | 'sierra'
  | 'aventura'
  | 'mercados'
  | 'relax'

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
}
