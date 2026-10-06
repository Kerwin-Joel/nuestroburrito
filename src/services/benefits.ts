import { supabase } from '../lib/supabase'
import { cachedFetch, invalidateCache } from '../lib/sessionCache'
import type { SpotBenefit } from '../types/benefit'

const mapBenefit = (row: any): SpotBenefit => ({
  id: row.id,
  spotId: row.spot_id ?? null,
  type: row.type,
  title: row.title,
  description: row.description ?? '',
  code: row.code ?? null,
  discountPct: row.discount_pct ?? null,
  validUntil: row.valid_until ?? null,
  active: row.active ?? true,
})

export const benefitsService = {
  /** Beneficios activos de todos los spots (el desbloqueo se calcula en la app). */
  async getActive(): Promise<SpotBenefit[]> {
    // Beneficios y Pasaporte piden esto por separado cada vez que se abren.
    return cachedFetch('benefits:active', async () => {
      const { data, error } = await supabase.from('spot_benefits').select('*').eq('active', true)
      if (error) { console.error(error); return [] }
      return (data ?? []).map(mapBenefit)
    })
  },

  /** Los spots que el usuario ya visitó marcando QR — lo que desbloquea cupones y sellos.
   *  Se pide igual en Beneficios, Pasaporte y Perfil — una sola caché por usuario entre las tres. */
  async getVisitedSpotIds(userId: string): Promise<Set<string>> {
    return cachedFetch(`benefits:visited:${userId}`, async () => {
      const { data, error } = await supabase.from('spot_visits').select('spot_id').eq('user_id', userId)
      if (error) { console.error(error); return new Set() }
      return new Set((data ?? []).map(r => r.spot_id as string))
    })
  },

  /** Después de marcar un QR, lo que ya sabíamos sobre visitas de ese usuario queda desactualizado. */
  invalidateVisited(userId: string): void {
    invalidateCache(`benefits:visited:${userId}`)
  },
}
