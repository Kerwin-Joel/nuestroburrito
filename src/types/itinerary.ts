export interface StopReview {
  rating: number
  liked: string
  improve: string
  createdAt: string
}

export interface ItineraryStop {
  id: string
  spotId: string
  spotName: string
  time: string
  description: string
  localTip: string
  travelToNext: string
  photoUrl: string
  lat: number
  lng: number
  visited: boolean
  review?: StopReview
}

export interface ItineraryPreferences {
  interests: string[]
  time: '4h' | '6h' | 'full' | 'weekend'
  group: 'solo' | 'couple' | 'family' | 'friends'
  budget: 'low' | 'mid' | 'high'
}

export type ItineraryStatus = 'draft' | 'in_progress' | 'completed'

export interface Itinerary {
  id: string
  userId: string
  title: string
  preferences: ItineraryPreferences
  stops: ItineraryStop[]
  generatedBy: 'ai' | 'manual'
  isSaved: boolean
  status: ItineraryStatus
  createdAt: string
}