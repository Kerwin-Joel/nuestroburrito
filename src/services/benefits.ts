import { supabase } from '../lib/supabase'
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
    const { data, error } = await supabase.from('spot_benefits').select('*').eq('active', true)
    if (error) { console.error(error); return [] }
    return (data ?? []).map(mapBenefit)
  },

  /** Los spots que el usuario ya visitó marcando QR — lo que desbloquea cupones y sellos. */
  async getVisitedSpotIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase.from('spot_visits').select('spot_id').eq('user_id', userId)
    if (error) { console.error(error); return new Set() }
    return new Set((data ?? []).map(r => r.spot_id as string))
  },
}
