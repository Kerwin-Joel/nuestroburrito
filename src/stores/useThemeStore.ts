import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ThemeMode = 'light' | 'twilight' | 'dark' | 'auto'

interface ThemeState {
  theme: ThemeMode
  computedTheme: 'light' | 'twilight' | 'dark'
}

interface ThemeActions {
  setTheme: (theme: ThemeMode) => void
  updateComputedTheme: () => void
}

const getAutoTheme = (): 'light' | 'twilight' | 'dark' => {
  const hour = new Date().getHours()
  // Morning/Day: 06:00 - 13:59 -> Light
  if (hour >= 6 && hour < 14) return 'light'
  // Afternoon/Evening: 14:00 - 18:59 -> Twilight
  if (hour >= 14 && hour < 19) return 'twilight'
  // Night: 19:00 - 05:59 -> Dark
  return 'dark'
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      theme: 'light',
      computedTheme: 'light',

      setTheme: (theme) => {
        set({ theme })
        get().updateComputedTheme()
      },

      updateComputedTheme: () => {
        const { theme } = get()
        if (theme === 'auto') {
          const autoTheme = getAutoTheme()
          if (get().computedTheme !== autoTheme) {
            set({ computedTheme: autoTheme })
          }
        } else {
          if (get().computedTheme !== theme) {
            set({ computedTheme: theme })
          }
        }
      }
    }),
    {
      name: 'burrito-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
