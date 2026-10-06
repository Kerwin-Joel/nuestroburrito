// El catálogo vendible de un negocio (spot): habitación, plato, producto o
// tour. Y los pedidos, que SIEMPRE quedan "pendiente_confirmacion" — Burrito
// nunca cobra ni procesa el pago, solo muestra el QR de Yape/Plin del negocio
// y registra el pedido para que el negocio lo confirme por su cuenta.
// Mismas tablas que usa la app nativa (catalog_items, orders) — ver
// burritonativo/app/.../data/model/CatalogItem.kt.

export type CatalogItemKind = 'habitacion' | 'plato' | 'producto' | 'tour'

export const CATALOG_KIND_LABELS: Record<CatalogItemKind, { label: string; unitFallback: string; emoji: string }> = {
  habitacion: { label: 'Habitación', unitFallback: 'por noche', emoji: '🛏️' },
  plato: { label: 'Plato', unitFallback: 'por unidad', emoji: '🍽️' },
  producto: { label: 'Producto', unitFallback: 'por unidad', emoji: '🛍️' },
  tour: { label: 'Tour', unitFallback: 'por persona', emoji: '🧭' },
}

export interface CatalogVariant {
  nombre: string
  opciones: string[]
}

export type StockStatus = 'disponible' | 'pocas_unidades' | 'agotado'

export interface CatalogItem {
  id: string
  spotId: string
  kind: CatalogItemKind
  name: string
  description: string | null
  price: number
  unitLabel: string | null
  images: string[]
  variants: CatalogVariant[]
  capacity: number | null
  stockStatus: StockStatus
  active: boolean
  sortOrder: number
}

export function displayUnit(item: CatalogItem): string {
  return item.unitLabel?.trim() || CATALOG_KIND_LABELS[item.kind].unitFallback
}

export interface OrderLine {
  itemId: string
  name: string
  qty: number
  price: number
  variant?: string | null
  // Solo en reservas de hotel — fechas ISO (yyyy-MM-dd), guardadas aparte del
  // texto de `variant` para poder reconstruir la reserva más tarde.
  checkIn?: string | null
  checkOut?: string | null
  guestName?: string | null
}

export type OrderStatus = 'pendiente_confirmacion' | 'confirmado' | 'entregado' | 'cancelado'

export interface StoreOrder {
  id?: string
  buyerId?: string | null
  spotId: string
  items: OrderLine[]
  total: number
  status: OrderStatus
  paymentMethod: string
  note?: string | null
  createdAt?: string
}

export type NewStoreOrder = Omit<StoreOrder, 'id' | 'buyerId' | 'createdAt' | 'status' | 'paymentMethod'> & {
  status?: OrderStatus
  paymentMethod?: string
}
