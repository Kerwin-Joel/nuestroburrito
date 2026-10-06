import type { Spot } from '../types/spot'
import type { ItineraryStop } from '../types/itinerary'

/** Espejo de Spot.toItineraryStop() en ExploreScreen.kt. La hora la ajusta el store al agregarla. */
export function spotToStop(spot: Spot): ItineraryStop {
  return {
    id: `stop-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    spotId: spot.id,
    spotName: spot.name,
    time: '12:00',
    description: spot.description,
    localTip: spot.localTip,
    travelToNext: '',
    photoUrl: spot.photoUrl,
    lat: spot.lat,
    lng: spot.lng,
    visited: false,
    eventDate: spot.eventDate,
    eventDateEnd: spot.eventDateEnd ?? null,
  }
}
