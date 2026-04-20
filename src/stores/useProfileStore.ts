import { create } from 'zustand'
import type { Itinerary } from '../types/itinerary'

interface ProfileState {
    itineraries: Itinerary[]
    lastFetchAt: number | null
    setItineraries: (its: Itinerary[]) => void
    removeItinerary: (id: string) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
    itineraries: [],
    lastFetchAt: null,
    setItineraries: (itineraries) => set({
        itineraries,
        lastFetchAt: Date.now()
    }),
    removeItinerary: (id) => set(state => ({
        itineraries: state.itineraries.filter(i => i.id !== id)
    })),
}))