import { supabase } from '../lib/supabase'
import { FEATURES } from '../lib/constants'
import { cachedFetch, invalidateCache } from '../lib/sessionCache'
import type { Itinerary } from '../types/itinerary'

// Mock storage en memoria
const mockItineraries: Itinerary[] = []

// Una sola key fija: en una pestaña solo hay un usuario logueado a la vez,
// así que no hace falta meter el userId en la key.
const MINE_CACHE_KEY = 'itineraries:mine'

const mapItinerary = (row: any): Itinerary => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    preferences: row.preferences,
    stops: row.stops,
    generatedBy: row.generated_by,
    isSaved: row.is_saved,
    status: row.status ?? 'in_progress',
    createdAt: row.created_at,
})

export const itinerariesService = {

    // Perfil, ItinerarioPage y CreateRouteSheet piden esto cada uno por su
    // lado — Perfil tenía su propio TTL de 5s nada más, así que igual volvía
    // a pedirlo en cuanto pasaban esos 5s. En caché de sesión acá, invalidada
    // en cada mutación de abajo (save/update/updateStatus/softDelete).
    async getByUser(userId: string): Promise<Itinerary[]> {
        if (!FEATURES.REAL_AUTH) {
            return mockItineraries.filter(i => i.userId === userId)
        }
        return cachedFetch(MINE_CACHE_KEY, async () => {
            const { data, error } = await supabase
                .from('itineraries')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            return (data ?? []).map(mapItinerary)
        })
    },

    async save(itinerary: Omit<Itinerary, 'id' | 'createdAt'>):
        Promise<Itinerary> {
        if (!FEATURES.REAL_AUTH) {
            const saved: Itinerary = {
                ...itinerary,
                id: `mock-it-${Date.now()}`,
                isSaved: true,
                status: itinerary.status ?? 'in_progress', // ← nuevo
                createdAt: new Date().toISOString(),
            }
            mockItineraries.push(saved)
            return saved
        }
        const { data, error } = await supabase
            .from('itineraries')
            .insert({
                user_id: itinerary.userId,
                title: itinerary.title,
                preferences: itinerary.preferences,
                stops: itinerary.stops,
                generated_by: itinerary.generatedBy,
                is_saved: true,
                is_active: true,
                status: itinerary.status ?? 'in_progress', // ← nuevo
            })
            .select()
            .single()

        if (error) throw error
        invalidateCache(MINE_CACHE_KEY)
        return mapItinerary(data)
    },

    // Nuevo método para completar
    async complete(id: string): Promise<void> {
        if (!FEATURES.REAL_AUTH) {
            const idx = mockItineraries.findIndex(i => i.id === id)
            if (idx !== -1) mockItineraries[idx].status = 'completed'
            return
        }
        const { error } = await supabase
            .from('itineraries')
            .update({ status: 'completed' })
            .eq('id', id)

        if (error) throw error
        invalidateCache(MINE_CACHE_KEY)
    },

    async updateStatus(id: string, status: 'draft' | 'in_progress' | 'completed'): Promise<void> {
        if (!FEATURES.REAL_AUTH) {
            const idx = mockItineraries.findIndex(i => i.id === id)
            if (idx !== -1) mockItineraries[idx].status = status
            return
        }
        const { error } = await supabase
            .from('itineraries')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        invalidateCache(MINE_CACHE_KEY)
    },

    // Soft delete — para auditoría
    async softDelete(id: string): Promise<void> {
        if (!FEATURES.REAL_AUTH) return

        const { error } = await supabase
            .rpc('soft_delete_itinerary', { itinerary_id: id })

        if (error) throw error
        invalidateCache(MINE_CACHE_KEY)
    },

    async update(id: string, data: Partial<Itinerary>): Promise<void> {
        if (!FEATURES.REAL_AUTH) return

        const { error } = await supabase
            .from('itineraries')
            .update({
                title: data.title,
                preferences: data.preferences,
                stops: data.stops,
                status: data.status,
            })
            .eq('id', id)

        if (error) throw error
        invalidateCache(MINE_CACHE_KEY)
    },

    async getById(id: string): Promise<Itinerary> {
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return mapItinerary(data)
    },

}