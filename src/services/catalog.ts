import { supabase } from '../lib/supabase'
import type { CatalogItem, NewStoreOrder, StoreOrder, CatalogVariant } from '../types/catalog'

const mapCatalogItem = (row: any): CatalogItem => ({
  id: row.id,
  spotId: row.spot_id,
  kind: row.kind,
  name: row.name,
  description: row.description ?? null,
  price: Number(row.price),
  unitLabel: row.unit_label ?? null,
  images: row.images ?? [],
  variants: (row.variants ?? []) as CatalogVariant[],
  capacity: row.capacity ?? null,
  stockStatus: row.stock_status ?? 'disponible',
  active: row.active ?? true,
  sortOrder: row.sort_order ?? 0,
})

const mapOrder = (row: any): StoreOrder => ({
  id: row.id,
  buyerId: row.buyer_id ?? null,
  spotId: row.spot_id,
  items: row.items ?? [],
  total: Number(row.total),
  status: row.status,
  paymentMethod: row.payment_method,
  note: row.note ?? null,
  createdAt: row.created_at,
})

const orderToRow = (order: NewStoreOrder & { status?: string; paymentMethod?: string }) => ({
  spot_id: order.spotId,
  items: order.items,
  total: order.total,
  status: order.status ?? 'pendiente_confirmacion',
  payment_method: order.paymentMethod ?? 'yape_plin',
  note: order.note ?? null,
})

export const catalogService = {
  /** Vacío si el spot no vende nada todavía — la sección simplemente no aparece. */
  async getForSpot(spotId: string): Promise<CatalogItem[]> {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('spot_id', spotId)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) { console.error(error); return [] }
    return (data ?? []).map(mapCatalogItem)
  },

  /** Crea el pedido con el comprador actual y devuelve su id, para el mensaje de WhatsApp. */
  async createOrder(order: NewStoreOrder): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...orderToRow(order), buyer_id: userData.user?.id ?? null })
      .select()
      .single()

    if (error) throw error
    return data?.id ?? null
  },

  /** Los pedidos del usuario actual en alguno de estos spots — para "Mis reservas". */
  async getMyOrders(spotIds: string[]): Promise<StoreOrder[]> {
    if (spotIds.length === 0) return []
    const { data: userData } = await supabase.auth.getUser()
    const buyerId = userData.user?.id
    if (!buyerId) return []

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .in('spot_id', spotIds)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return [] }
    return (data ?? []).map(mapOrder)
  },

  /**
   * ¿Esa habitación sigue libre en ese rango de fechas? Corre en el server
   * (función `room_is_available`, SECURITY DEFINER) para no tener que
   * exponer las reservas de otros huéspedes al cliente — solo devuelve un
   * booleano. Si la consulta falla, se deja reservar igual (el hotel termina
   * de confirmar por WhatsApp) en vez de trabar el flujo.
   */
  async isRoomAvailable(itemId: string, checkInIso: string, checkOutIso: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('room_is_available', {
      p_item_id: itemId,
      p_check_in: checkInIso,
      p_check_out: checkOutIso,
    })
    if (error) { console.error(error); return true }
    return data as boolean
  },

  /** Cancela un pedido propio (RLS solo deja tocar los del comprador actual). */
  async cancelOrder(orderId: string): Promise<void> {
    const { error } = await supabase.from('orders').update({ status: 'cancelado' }).eq('id', orderId)
    if (error) throw error
  },
}

/** Un código corto y legible en vez del id crudo — como el localizador de una reserva real. */
export function confirmationCode(orderId?: string | null): string {
  const tail = (orderId ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `BR-${tail || 'PEND'}`
}
