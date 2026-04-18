import type { SpotCategory } from './spot'

export interface ChurreProfile {
  id: string
  userId: string
  name: string
  bio: string
  avatarUrl: string
  avatarColor: string
  university: 'UDEP' | 'UNP' | 'UCV' | null
  zones: string[]
  specialties: SpotCategory[]
  rating: number
  toursCount: number
  isVerified: boolean
}

export interface Review {
  id: string
  churreId: string
  touristId: string
  touristName: string
  touristAvatar: string
  rating: number
  comment: string
  tourType: string
  createdAt: string
}
