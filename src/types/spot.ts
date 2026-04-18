export type SpotCategory =
  | 'playa'
  | 'gastronomia'
  | 'cultura'
  | 'sierra'
  | 'aventura'
  | 'mercados'
  | 'relax'

export type SpotStatus = 'pending' | 'verified' | 'rejected'

export interface Spot {
  id: string
  churreId: string
  name: string
  description: string
  localTip: string
  category: SpotCategory
  photoUrl: string
  lat: number
  lng: number
  address: string
  schedule: Record<string, string>
  priceRange: 'free' | 'low' | 'mid' | 'high'
  status: SpotStatus
  rating: number
  reviewCount: number
  tiktokUrls: string[]
  createdAt: string
}
