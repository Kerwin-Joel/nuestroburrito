import { create } from 'zustand'
import type { Itinerary } from '../types/itinerary'

interface ProfileState {
    itineraries: Itinerary[]
    setItineraries: (its: Itinerary[]) => void
    removeItinerary: (id: string) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
    itineraries: [],
    // itinerariesService.getByUser ya tiene su propia caché de sesión (ver
    // sessionCache.ts) — no hace falta que este store lleve también su
    // propio control de frescura.
    setItineraries: (itineraries) => set({ itineraries }),
    removeItinerary: (id) => set(state => ({
        itineraries: state.itineraries.filter(i => i.id !== id)
    })),
}))