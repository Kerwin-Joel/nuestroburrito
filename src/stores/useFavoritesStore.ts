import { create } from 'zustand'

/**
 * Favoritos guardados en este navegador — igual que FavoritesStore.kt en la
 * app nativa (SharedPreferences): es una comodidad del dispositivo, no algo
 * que se sincronice entre aparatos. Cuando exista la tabla en Supabase
 * (ver memoria "Pendientes de Supabase"), esto se cambia por una consulta real.
 */
const STORAGE_KEY = 'burrito_favorites'

function loadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveIds(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])) } catch { /* modo privado, etc. */ }
}

interface FavoritesState {
  ids: Set<string>
  isFavorite: (spotId: string) => boolean
  toggle: (spotId: string) => void
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: loadIds(),
  isFavorite: (spotId) => get().ids.has(spotId),
  toggle: (spotId) => {
    const ids = new Set(get().ids)
    if (ids.has(spotId)) ids.delete(spotId); else ids.add(spotId)
    saveIds(ids)
    set({ ids })
  },
}))
