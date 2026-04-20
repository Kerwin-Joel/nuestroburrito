import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Itinerary, ItineraryStop, ItineraryPreferences } from '../types/itinerary'
import { MOCK_ITINERARY } from '../lib/mockData'

interface ItineraryState {
  current: Itinerary | null
  preferences: ItineraryPreferences | null
  isGenerating: boolean
  setCurrent: (it: Itinerary) => void
  setPreferences: (prefs: ItineraryPreferences) => void
  setGenerating: (v: boolean) => void
  addStop: (stop: ItineraryStop) => void
  removeStop: (id: string) => void
  reorderStops: (from: number, to: number) => void
  loadDemo: () => void
  clear: () => void
  isSelectingSpot: boolean        // ← nuevo
  setSelectingSpot: (v: boolean) => void  // ← nuevo
}

export const useItineraryStore = create<ItineraryState>()(
  persist(
    (set) => ({
      current: null,
      preferences: null,
      isGenerating: false,

      setCurrent: (it) => set({ current: it }),
      setPreferences: (prefs) => set({ preferences: prefs }),
      setGenerating: (v) => set({ isGenerating: v }),

      addStop: (stop) =>
        set((state) => ({
          current: state.current
            ? { ...state.current, stops: [...state.current.stops, stop] }
            : null,
        })),

      removeStop: (id) =>
        set((state) => ({
          current: state.current
            ? { ...state.current, stops: state.current.stops.filter((s) => s.id !== id) }
            : null,
        })),

      reorderStops: (from, to) =>
        set((state) => {
          if (!state.current) return state
          const stops = [...state.current.stops]
          const [moved] = stops.splice(from, 1)
          stops.splice(to, 0, moved)
          return { current: { ...state.current, stops } }
        }),

      loadDemo: () => set({ current: MOCK_ITINERARY }),

      // clear limpia localStorage también
      clear: () => {
        set({ current: null, preferences: null, isSelectingSpot: false })
        // Limpia también localStorage
        localStorage.removeItem('burrito-itinerary')
      },
      isSelectingSpot: false,
      setSelectingSpot: (v) => set({ isSelectingSpot: v }),
    }),
    {
      name: 'burrito-itinerary',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // ← Quita current del persist
        // solo guarda preferences e isSelectingSpot
        preferences: state.preferences,
        isSelectingSpot: state.isSelectingSpot,
      }),
    }
  )
)