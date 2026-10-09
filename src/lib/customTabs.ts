import { BookOpen, Store, BookMarked, Ticket, Luggage, Hotel, Heart, Sparkles, QrCode, LifeBuoy, type LucideIcon } from 'lucide-react'

/**
 * Lo que puede ocupar el cuarto lugar de la barra flotante (por defecto,
 * Historia) — espejo de CustomTab.kt en la app nativa. Inicio, Explorar,
 * Mi día y Perfil son fijos; este hueco lo elige el usuario en su Perfil.
 *
 * 7 llevan a una pantalla (`to`); 3 son acciones (`action`): abren el
 * asistente de IA, el escáner de QR o la ficha de emergencias desde
 * cualquier pantalla, sin navegar a ningún lado.
 */
export type CustomTabId =
  | 'historia' | 'tienda' | 'pasaporte' | 'beneficios' | 'servicios' | 'hoteles' | 'favoritos'
  | 'wizard' | 'qr' | 'emergencias'

export interface CustomTabOption {
  id: CustomTabId
  label: string
  title: string
  sub: string
  icon: LucideIcon
  to?: string
  action?: 'wizard' | 'qr-scan' | 'emergencias'
}

export const CUSTOM_TAB_OPTIONS: CustomTabOption[] = [
  { id: 'historia', label: 'Historia', title: 'Historia de Piura', sub: 'Relatos y lugares con historia', icon: BookOpen, to: '/app/historia' },
  { id: 'tienda', label: 'Tienda', title: 'Tienda Burrito', sub: 'Merch, tours y hecho en Piura', icon: Store, to: '/app/tienda' },
  { id: 'pasaporte', label: 'Pasaporte', title: 'Pasaporte', sub: 'Tus sellos de spots visitados', icon: BookMarked, to: '/app/pasaporte' },
  { id: 'beneficios', label: 'Cupones', title: 'Mis beneficios', sub: 'Descuentos que desbloqueas', icon: Ticket, to: '/app/beneficios' },
  { id: 'servicios', label: 'Servicios', title: 'Servicios turísticos', sub: 'Transporte, dinero, salud y guías', icon: Luggage, to: '/app/servicios' },
  { id: 'hoteles', label: 'Hoteles', title: 'Hoteles en Piura', sub: 'Reserva tu habitación', icon: Hotel, to: '/app/hoteles' },
  { id: 'favoritos', label: 'Favoritos', title: 'Favoritos', sub: 'Los spots que guardaste', icon: Heart, to: '/app/favoritos' },
  { id: 'wizard', label: 'Armar IA', title: 'Armar día con IA', sub: 'Tu ruta lista en un minuto', icon: Sparkles, action: 'wizard' },
  { id: 'qr', label: 'Escanear', title: 'Escanear QR', sub: 'Marca tu visita al llegar', icon: QrCode, action: 'qr-scan' },
  { id: 'emergencias', label: 'SOS', title: 'Emergencias', sub: 'Números útiles de Piura', icon: LifeBuoy, action: 'emergencias' },
]

export const DEFAULT_CUSTOM_TAB: CustomTabId = 'historia'
