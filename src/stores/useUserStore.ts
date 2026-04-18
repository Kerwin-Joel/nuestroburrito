import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TouristUser } from '../types/user'
import type { Itinerary } from '../types/itinerary'

interface UserState {
  user: TouristUser | null
  savedItineraries: Itinerary[]
  setUser: (user: TouristUser) => void
  saveItinerary: (itinerary: Itinerary) => void
  removeItinerary: (id: string) => void
  updateUserName: (name: string) => void
}

const defaultUser: TouristUser = {
  id: 'tourist-demo',
  name: 'Viajero',
  email: 'viajero@example.com',
  avatarColor: '#FF5500',
  createdAt: new Date().toISOString(),
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: defaultUser,
      savedItineraries: [],
      setUser: (user) => set({ user }),
      saveItinerary: (itinerary) =>
        set((state) => ({
          savedItineraries: [
            { ...itinerary, isSaved: true },
            ...state.savedItineraries.filter((i) => i.id !== itinerary.id),
          ],
        })),
      removeItinerary: (id) =>
        set((state) => ({
          savedItineraries: state.savedItineraries.filter((i) => i.id !== id),
        })),
      updateUserName: (name) =>
        set((state) => ({
          user: state.user ? { ...state.user, name } : state.user,
        })),
    }),
    { name: 'burrito-user' }
  )
)
