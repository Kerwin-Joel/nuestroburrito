export type TourStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Tour {
  id: string
  churreId: string
  touristId: string
  touristName: string
  touristAvatar: string
  type: 'half_day' | 'full_day'
  date: string
  time: string
  price: number
  status: TourStatus
  notes: string
  zones: string[]
  createdAt: string
}
