import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Itinerary, ItineraryStop, ItineraryPreferences } from '../types/itinerary'
import { MOCK_ITINERARY } from '../lib/mockData'
import { itinerariesService } from '../services/itineraries'
import { useUIStore } from './useUIStore'

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
  isSelectingSpot: boolean
  setSelectingSpot: (v: boolean) => void
  /**
   * Spot que se quiso agregar sin tener una ruta abierta — mientras no sea
   * null, CreateRouteSheet (montado en TouristLayout) pide crear la ruta.
   * Espejo de `pendingStop` en ItineraryViewModel.kt.
   */
  pendingStop: ItineraryStop | null
  hasOpenRoute: () => boolean
  /** Punto de entrada único para "agregar spot" desde Explorar o el detalle. */
  requestAddStop: (stop: ItineraryStop) => void
  resolvePendingStop: () => void
  cancelPendingStop: () => void
  /** Quita del día todas las paradas de ese spot (el "−" de las tarjetas). */
  removeSpot: (spotId: string) => void
}

const toast = (type: 'success' | 'error', message: string) =>
  useUIStore.getState().addToast({ type, message })

const isPersisted = (it: Itinerary) =>
  !!it.id && it.id !== 'itinerary-demo' && !it.id.startsWith('new-')

/** Sube las paradas si la ruta ya existe en Supabase (fuera de "Mi día" no corre el autoguardado). */
function persistStops(it: Itinerary) {
  if (!isPersisted(it)) return
  itinerariesService.update(it.id, { stops: it.stops }).catch(err => {
    console.error('No se pudieron guardar las paradas:', err)
  })
}

/** Una hora después de la última parada, o 09:00 si es la primera. */
function suggestTime(stops: ItineraryStop[]): string {
  const last = stops[stops.length - 1]?.time
  if (!last) return '09:00'
  const [h, m] = last.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return '09:00'
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const useItineraryStore = create<ItineraryState>()(
  persist(
    (set, get) => {
      // Agregar con las reglas de la app: sin repetir spots y avisando — el
      // addStop "crudo" de abajo lo sigue usando el formulario de Mi día.
      const appendSpotStop = (stop: ItineraryStop) => {
        const it = get().current
        if (!it) return
        if (it.status === 'completed') {
          set({ pendingStop: stop })
          return
        }
        if (stop.spotId && it.stops.some(s => s.spotId === stop.spotId)) {
          toast('error', `${stop.spotName} ya está en tu itinerario`)
          return
        }
        const updated = { ...it, stops: [...it.stops, { ...stop, time: suggestTime(it.stops) }] }
        set({ current: updated })
        persistStops(updated)
        toast('success', `✓ ${stop.spotName} agregado al itinerario`)
      }

      return {
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
          set({ current: null, preferences: null, isSelectingSpot: false, pendingStop: null })
          localStorage.removeItem('burrito-itinerary')
        },
        isSelectingSpot: false,
        setSelectingSpot: (v) => set({ isSelectingSpot: v }),

        pendingStop: null,

        // Una ruta completada queda cerrada: sumarle spots la "reabriría" a medias.
        hasOpenRoute: () => {
          const it = get().current
          return !!it && it.status !== 'completed'
        },

        requestAddStop: (stop) => {
          if (get().hasOpenRoute()) appendSpotStop(stop)
          else set({ pendingStop: stop })
        },

        resolvePendingStop: () => {
          const stop = get().pendingStop
          set({ pendingStop: null })
          if (stop) appendSpotStop(stop)
        },

        cancelPendingStop: () => set({ pendingStop: null }),

        removeSpot: (spotId) => {
          const it = get().current
          if (!it) return
          const stop = it.stops.find(s => s.spotId === spotId)
          if (!stop) return
          const updated = { ...it, stops: it.stops.filter(s => s.spotId !== spotId) }
          set({ current: updated })
          persistStops(updated)
          toast('success', `${stop.spotName} quitado del itinerario`)
        },
      }
    },
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
