import { supabase } from '../lib/supabase'

/**
 * Pasaporte · visitas y premios por spot — espejo de passport/PassportRepository.kt.
 * Todo pasa por RPC (supabase/migrations/20261022_loyalty_visits.sql): el
 * cliente nunca lee códigos QR ni PIN; solo los envía para que el servidor
 * los valide.
 */

export interface Loyalty {
  enabled: boolean
  visits_required: number
  reward_title: string | null
  reward_description: string | null
  reward_emoji: string
  validation: 'qr' | 'pin'
  cooldown_hours: number
}

export interface Reward {
  id: string
  title: string
  description: string | null
  emoji: string
  earned_at: string
  redeemed_at: string | null
}

export interface SpotPassport {
  spot_id: string
  visits: number
  last_visit: string | null
  loyalty: Loyalty | null
  /** Visitas hacia el próximo premio (se reinicia al ganarlo). */
  progress: number
  rewards: Reward[]
  history?: { visited_at: string; method: 'qr' | 'pin'; source: 'passport' | 'itinerary' }[]
}

export type CheckInReason = 'INVALID_CODE' | 'PIN_REQUIRED' | 'WRONG_PIN' | 'TOO_MANY_ATTEMPTS'

export type CheckInResult =
  | {
    ok: true
    spot_id: string
    spot_name: string
    /** Ya había una visita reciente: no suma otra (sí vale para la asistencia del itinerario). */
    already: boolean
    method: 'qr' | 'pin'
    summary: SpotPassport
    reward_earned: Reward | null
  }
  | { ok: false; reason: CheckInReason; spot_id?: string; spot_name?: string; attempts_left?: number }

export type RedeemResult = { ok: true } | { ok: false; reason: 'WRONG_PIN' | 'TOO_MANY_ATTEMPTS' | 'ALREADY_REDEEMED' | 'NOT_FOUND'; attempts_left?: number }

export function checkInMessage(r: Exclude<CheckInResult, { ok: true }>): string {
  switch (r.reason) {
    case 'PIN_REQUIRED': return `${r.spot_name?.trim() ?? 'Este local'} valida las visitas con PIN: pídeselo al personal.`
    case 'WRONG_PIN': return r.attempts_left ? `PIN incorrecto. Te quedan ${r.attempts_left} intentos.` : 'PIN incorrecto.'
    case 'TOO_MANY_ATTEMPTS': return 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
    default: return 'Ese código no es de Burrito o ya no está activo.'
  }
}

export function redeemMessage(r: Exclude<RedeemResult, { ok: true }>): string {
  switch (r.reason) {
    case 'WRONG_PIN': return r.attempts_left ? `PIN incorrecto. Quedan ${r.attempts_left} intentos.` : 'PIN incorrecto.'
    case 'TOO_MANY_ATTEMPTS': return 'Demasiados intentos. Espera unos minutos.'
    case 'ALREADY_REDEEMED': return 'Este premio ya fue canjeado.'
    default: return 'No encontramos ese premio.'
  }
}

/** Saca el código de un QR: el impreso trae una URL con ?code=…, el del panel del dueño también. */
export function codeFromScan(raw: string): string {
  try {
    const param = new URL(raw).searchParams.get('code')
    if (param) return param
  } catch { /* no es URL */ }
  return raw.trim()
}

export const passportService = {
  async summary(): Promise<SpotPassport[]> {
    const { data, error } = await supabase.rpc('passport_summary')
    if (error) throw error
    return (data ?? []) as SpotPassport[]
  },

  async spot(spotId: string): Promise<SpotPassport> {
    const { data, error } = await supabase.rpc('passport_spot', { p_spot: spotId })
    if (error) throw error
    return data as SpotPassport
  },

  /** QR escaneado (impreso o dinámico) o PIN dictado por el personal. */
  async checkIn(a: { code?: string; spotId?: string; pin?: string; itineraryId?: string }): Promise<CheckInResult> {
    const { data, error } = await supabase.rpc('visit_check_in', {
      p_code: a.code ?? null, p_spot: a.spotId ?? null, p_pin: a.pin ?? null, p_itinerary: a.itineraryId ?? null,
    })
    if (error) throw error
    return data as CheckInResult
  },

  async redeem(rewardId: string, pin: string): Promise<RedeemResult> {
    const { data, error } = await supabase.rpc('loyalty_redeem', { p_reward: rewardId, p_pin: pin })
    if (error) throw error
    return data as RedeemResult
  },
}
