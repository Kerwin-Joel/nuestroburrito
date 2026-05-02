import { supabase } from '../lib/supabase'
import { FEATURES } from '../lib/constants'
import { MOCK_SPOTS } from '../lib/mockData'
import type { Spot } from '../types/spot'

// Convierte snake_case de Supabase a camelCase
const mapSpot = (row: any): Spot => ({
  id: row.id,
  churreId: row.churre_id,
  name: row.name,
  description: row.description,
  localTip: row.local_tip,
  category: row.category,
  photoUrl: row.photo_url,
  photos: row.photos ?? [],
  lat: parseFloat(row.lat),
  lng: parseFloat(row.lng),
  address: row.address,
  schedule: row.schedule ?? {},
  priceRange: row.price_range,
  status: row.status,
  rating: parseFloat(row.rating),
  reviewCount: row.review_count,
  tiktokUrls: row.tiktok_urls ?? [],
  socialLinks: row.social_links ?? undefined,
  createdAt: row.created_at,
  eventDate: row.event_date ?? null,
})

// Convierte camelCase a snake_case para Supabase
const mapToRow = (data: Partial<Spot> & { price_range?: string; rating?: number; review_count?: number; schedule?: any; photos?: string[]; socialLinks?: any }) => ({
  churre_id: data.churreId,
  name: data.name,
  description: data.description,
  local_tip: data.localTip,
  category: data.category,
  photo_url: data.photoUrl,
  photos: data.photos ?? (data as any).photos,
  lat: data.lat,
  lng: data.lng,
  address: data.address,
  schedule: data.schedule,
  price_range: data.priceRange ?? (data as any).price_range,
  rating: data.rating ?? (data as any).rating,
  review_count: data.reviewCount ?? (data as any).review_count,
  status: data.status,
  tiktok_urls: data.tiktokUrls,
  social_links: data.socialLinks ?? (data as any).social_links,
  event_date: data.eventDate ?? (data as any).event_date ?? null,

})

export const spotsService = {

  async getSpots(): Promise<Spot[]> {
    if (!FEATURES.REAL_AUTH) return MOCK_SPOTS

    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })

    if (error) throw error

    const supabaseSpots = (data ?? []).map(mapSpot)

    const allSpots = [...supabaseSpots, ...MOCK_SPOTS].filter(
      (spot, index, self) =>
        index === self.findIndex(s => s.id === spot.id)
    )

    return allSpots
  },

  // Para admin — lee TODOS los spots (cualquier status)
  async getAllSpots(): Promise<Spot[]> {
    if (!FEATURES.REAL_AUTH) return MOCK_SPOTS

    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapSpot)
  },

  async getSpotById(id: string): Promise<Spot> {
    if (!FEATURES.REAL_AUTH) {
      const spot = MOCK_SPOTS.find(s => s.id === id)
      if (!spot) throw new Error(`Spot ${id} not found`)
      return spot
    }

    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapSpot(data)
  },

  async createSpot(
    spotData: Omit<Spot, 'id' | 'createdAt'> & {
      price_range?: string
      rating?: number
      review_count?: number
      schedule?: Record<string, string>
      event_date?: string | null;
    }
  ): Promise<Spot> {
    if (!FEATURES.REAL_AUTH) {
      return {
        ...spotData,
        id: `spot-${Date.now()}`,
        rating: spotData.rating ?? 0,
        reviewCount: spotData.review_count ?? 0,
        createdAt: new Date().toISOString(),
        eventDate: spotData.event_date || null,
      }
    }

    const { data, error } = await supabase
      .from('spots')
      .insert(mapToRow(spotData))
      .select()
      .single()

    if (error) throw error
    return mapSpot(data)
  },

  async updateSpot(id: string, updates: Partial<Spot>): Promise<Spot> {
    if (!FEATURES.REAL_AUTH) {
      const spot = MOCK_SPOTS.find(s => s.id === id)
      if (!spot) throw new Error(`Spot ${id} not found`)
      return { ...spot, ...updates }
    }

    const { data, error } = await supabase
      .from('spots')
      .update(mapToRow(updates))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapSpot(data)
  },

  async updateStatus(
    id: string,
    status: Spot['status']
  ): Promise<void> {
    if (!FEATURES.REAL_AUTH) return

    const { error } = await supabase
      .from('spots')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  },

  async deleteSpot(id: string): Promise<void> {
    if (!FEATURES.REAL_AUTH) return

    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Suscripción en tiempo real para turistas
  subscribeToSpots(callback: (spots: Spot[]) => void) {
    return supabase
      .channel('spots-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spots' },
        async () => {
          // Cuando hay cambio, recarga los spots verificados
          const { data } = await supabase
            .from('spots')
            .select('*')
            .eq('status', 'verified')
            .order('created_at', { ascending: false })
          callback((data ?? []).map(mapSpot))
        }
      )
      .subscribe()
  },
}