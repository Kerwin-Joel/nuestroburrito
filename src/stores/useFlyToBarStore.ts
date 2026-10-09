import { create } from 'zustand'
import type { LucideIcon } from 'lucide-react'

/**
 * Espejo de FlyToBarState en FlyToBar.kt (nativo): cuando eliges una opción
 * en "Tu menú", el ícono vuela en arco desde la tarjeta hasta su lugar en la
 * barra flotante. La elección se aplica recién al 85% del vuelo (COMMIT_AT),
 * justo cuando la barra rebota — no al tocar la tarjeta.
 */
export interface Flight {
  id: number
  icon: LucideIcon
  from: DOMRect
  onLand: () => void
  committed: boolean
}

interface FlyToBarState {
  slotBounds: DOMRect | null
  flight: Flight | null
  landings: number
  setSlotBounds: (rect: DOMRect | null) => void
  launch: (icon: LucideIcon, from: DOMRect, onLand: () => void) => void
  commit: () => void
  finish: () => void
}

export const useFlyToBarStore = create<FlyToBarState>((set, get) => ({
  slotBounds: null,
  flight: null,
  landings: 0,

  setSlotBounds: (rect) => set({ slotBounds: rect }),

  launch: (icon, from, onLand) => {
    // Si ya hay un vuelo en curso, se aplica de inmediato para no perder la elección.
    const prev = get().flight
    if (prev && !prev.committed) {
      prev.committed = true
      prev.onLand()
      set(s => ({ landings: s.landings + 1 }))
    }
    set({ flight: { id: Date.now() + Math.random(), icon, from, onLand, committed: false } })
  },

  commit: () => {
    const f = get().flight
    if (!f || f.committed) return
    f.committed = true
    f.onLand()
    set(s => ({ landings: s.landings + 1 }))
  },

  finish: () => {
    get().commit()
    set({ flight: null })
  },
}))
