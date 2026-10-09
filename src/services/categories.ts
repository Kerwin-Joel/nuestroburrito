import { supabase } from '../lib/supabase'
import { cachedFetch, invalidateCache } from '../lib/sessionCache'

// ─── Types ───────────────────────────────────────────────
export interface Category {
  id: string
  label: string
  emoji: string
  color: string
  sortOrder: number
  createdAt: string
}

export interface Zone {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

// ─── Mappers ─────────────────────────────────────────────
const mapCategory = (row: any): Category => ({
  id: row.id,
  label: row.label,
  emoji: row.emoji,
  color: row.color,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
})

const mapZone = (row: any): Zone => ({
  id: row.id,
  name: row.name,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
})

// ─── Service ─────────────────────────────────────────────
export const categoriesService = {

  // ── Categories ──────────────────────────────────────────

  async getAll(): Promise<Category[]> {
    // Casi no cambian (las administra el admin) — Explorar, el formulario
    // de spot, etc. pedían esta misma lista cada vez que se montaban.
    return cachedFetch('categories', async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []).map(mapCategory)
    })
  },

  async create(cat: Omit<Category, 'createdAt' | 'sortOrder'> & { sortOrder?: number }): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: cat.id,
        label: cat.label,
        emoji: cat.emoji,
        color: cat.color,
        sort_order: cat.sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    invalidateCache('categories')
    return mapCategory(data)
  },

  async update(id: string, updates: Partial<Pick<Category, 'label' | 'emoji' | 'color' | 'sortOrder'>>): Promise<Category> {
    const row: any = {}
    if (updates.label !== undefined) row.label = updates.label
    if (updates.emoji !== undefined) row.emoji = updates.emoji
    if (updates.color !== undefined) row.color = updates.color
    if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder

    const { data, error } = await supabase
      .from('categories')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    invalidateCache('categories')
    return mapCategory(data)
  },

  /** Mueve todos los spots de una categoría a otra (antes de borrarla). */
  async reassignSpots(fromId: string, toId: string): Promise<void> {
    const { error } = await supabase
      .from('spots')
      .update({ category: toId })
      .eq('category', fromId)

    if (error) throw error
    invalidateCache('hotels')
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    invalidateCache('categories')
  },

  // ── Zones ───────────────────────────────────────────────

  async getAllZones(): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapZone)
  },

  async createZone(name: string, sortOrder?: number): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert({ name, sort_order: sortOrder ?? 0 })
      .select()
      .single()

    if (error) throw error
    return mapZone(data)
  },

  async updateZone(id: string, updates: Partial<Pick<Zone, 'name' | 'sortOrder'>>): Promise<Zone> {
    const row: any = {}
    if (updates.name !== undefined) row.name = updates.name
    if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder

    const { data, error } = await supabase
      .from('zones')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapZone(data)
  },

  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
