import { supabase } from '../lib/supabase'
import { spotsService } from './spots'
import type { Spot } from '../types/spot'

/**
 * Datos del panel de control. Cada fuente se pide por separado y falla sola:
 * si una tabla no existe o las políticas RLS no dejan leerla, esa tarjeta
 * muestra "sin acceso" en vez de tumbar todo el dashboard.
 */

export interface ProfileRow {
  id: string
  name: string | null
  role: 'tourist' | 'churre' | 'admin'
  status: 'active' | 'pending' | 'rejected' | null
  created_at: string | null
}

export interface ReviewRow {
  id: string
  spot_name: string | null
  rating: number | null
  liked: string | null
  improve: string | null
  created_at: string | null
}

export interface OrderRow {
  id: string
  total: number | null
  status: string | null
  created_at: string | null
}

export interface DashboardData {
  spots: Spot[] | null
  profiles: ProfileRow[] | null
  itineraryDates: string[] | null   // created_at de los últimos 30 días
  itineraryTotal: number | null
  reviews: ReviewRow[] | null
  reviewTotal: number | null
  orders: OrderRow[] | null          // últimos 30 días
}

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

async function safe<T>(p: PromiseLike<T>): Promise<T | null> {
  try { return await p } catch { return null }
}

export async function loadDashboard(): Promise<DashboardData> {
  const since = daysAgoIso(30)

  const [spots, profiles, itins, itinCount, reviews, orders] = await Promise.all([
    safe(spotsService.getAllSpots()),
    safe(supabase.from('profiles').select('id, name, role, status, created_at')
      .then(r => { if (r.error) throw r.error; return r.data as ProfileRow[] })),
    safe(supabase.from('itineraries').select('created_at').gte('created_at', since)
      .then(r => { if (r.error) throw r.error; return (r.data ?? []).map(x => x.created_at as string) })),
    safe(supabase.from('itineraries').select('id', { count: 'exact', head: true })
      .then(r => { if (r.error) throw r.error; return r.count ?? 0 })),
    safe(supabase.from('spot_reviews').select('id, spot_name, rating, liked, improve, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(6)
      .then(r => { if (r.error) throw r.error; return { rows: r.data as ReviewRow[], count: r.count ?? 0 } })),
    safe(supabase.from('orders').select('id, total, status, created_at').gte('created_at', since)
      .then(r => { if (r.error) throw r.error; return r.data as OrderRow[] })),
  ])

  return {
    spots,
    profiles,
    itineraryDates: itins,
    itineraryTotal: itinCount,
    reviews: reviews?.rows ?? null,
    reviewTotal: reviews?.count ?? null,
    orders,
  }
}

/** Lo que espera una acción del admin: alimenta badges del menú y notificaciones. */
export interface AdminInbox {
  pendingSpots: { id: string; name: string; created_at: string }[]
  pendingChurres: { id: string; name: string | null; created_at: string | null }[]
  pendingOrders: number
}

export async function loadInbox(): Promise<AdminInbox> {
  const [spots, churres, orders] = await Promise.all([
    safe(supabase.from('spots').select('id, name, created_at').eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(20)
      .then(r => { if (r.error) throw r.error; return r.data as AdminInbox['pendingSpots'] })),
    safe(supabase.from('profiles').select('id, name, created_at').eq('role', 'churre').eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(20)
      .then(r => { if (r.error) throw r.error; return r.data as AdminInbox['pendingChurres'] })),
    safe(supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pendiente_confirmacion')
      .then(r => { if (r.error) throw r.error; return r.count ?? 0 })),
  ])
  return { pendingSpots: spots ?? [], pendingChurres: churres ?? [], pendingOrders: orders ?? 0 }
}
