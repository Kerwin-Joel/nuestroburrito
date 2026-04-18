import { create } from 'zustand'
import type { Spot, SpotCategory } from '../types/spot'
import { MOCK_SPOTS } from '../lib/mockData'

interface SpotsState {
  spots: Spot[]
  filtered: Spot[]
  selectedSpot: Spot | null
  activeCategory: SpotCategory | null
  sheetOpen: boolean
  sheetExpanded: boolean
  viewMode: 'map' | 'list'
  setSpots: (spots: Spot[]) => void
  setCategory: (cat: SpotCategory | null) => void
  selectSpot: (spot: Spot | null) => void
  setSheetOpen: (v: boolean) => void
  setSheetExpanded: (v: boolean) => void
  toggleView: () => void
  loadMock: () => void
}

export const useSpotsStore = create<SpotsState>((set, get) => ({
  spots: [],
  filtered: [],
  selectedSpot: null,
  activeCategory: null,
  sheetOpen: false,
  sheetExpanded: false,
  viewMode: 'list',
  setSpots: (spots) => set({ spots, filtered: spots }),
  setCategory: (cat) => {
    const spots = get().spots
    const filtered = cat ? spots.filter((s) => s.category === cat) : spots
    set({ activeCategory: cat, filtered })
  },
  selectSpot: (spot) => set({ selectedSpot: spot, sheetOpen: !!spot, sheetExpanded: false }),
  setSheetOpen: (v) => set({ sheetOpen: v, sheetExpanded: v ? get().sheetExpanded : false }),
  setSheetExpanded: (v) => set({ sheetExpanded: v }),
  toggleView: () => set((s) => ({ viewMode: s.viewMode === 'map' ? 'list' : 'map' })),
  loadMock: () => set({ spots: MOCK_SPOTS, filtered: MOCK_SPOTS }),
}))
