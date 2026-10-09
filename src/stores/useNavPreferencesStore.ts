import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CUSTOM_TAB, type CustomTabId } from '../lib/customTabs'

/**
 * Preferencia guardada en este dispositivo (no en Supabase) — espejo de
 * NavPreferences.kt: es una comodidad local, tiene que estar disponible al
 * instante sin red, y no tiene sentido sincronizarla entre dispositivos.
 */
interface NavPreferencesState {
  customTab: CustomTabId
  setCustomTab: (tab: CustomTabId) => void
}

export const useNavPreferencesStore = create<NavPreferencesState>()(
  persist(
    (set) => ({
      customTab: DEFAULT_CUSTOM_TAB,
      setCustomTab: (tab) => set({ customTab: tab }),
    }),
    {
      name: 'burrito-nav',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
