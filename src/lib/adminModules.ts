import {
  LayoutDashboard,
  MapPin,
  Video,
  Users,
  UserCircle,
  Sun,
  Star,
  Tag,
  Settings,
  QrCode,
  LucideIcon,
  BookOpen
} from 'lucide-react'

export interface AdminModule {
  id: string
  label: string
  icon: LucideIcon
  path: string
  enabled: boolean
  badge?: number
  description: string
  /** Sección del menú lateral. */
  group: AdminGroup
}

export type AdminGroup = 'General' | 'Catálogo' | 'Contenido' | 'Comunidad' | 'Sistema'

export const ADMIN_GROUPS: AdminGroup[] = ['General', 'Catálogo', 'Contenido', 'Comunidad', 'Sistema']

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'dashboard',
    group: 'General',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    enabled: true,
    description: 'Métricas generales de la plataforma',
  },
  {
    id: 'spots',
    group: 'Catálogo',
    label: 'Spots',
    icon: MapPin,
    path: '/admin/spots',
    enabled: true,
    description: 'Gestión y aprobación de spots',
  },
  {
    id: 'tiktoks',
    group: 'Catálogo',
    label: 'TikToks',
    icon: Video,
    path: '/admin/tiktoks',
    enabled: true,
    description: 'Videos de TikTok por spot',
  },
  {
    id: 'churres',
    group: 'Comunidad',
    label: 'Churres',
    icon: Users,
    path: '/admin/churres',
    enabled: true,
    description: 'Verificación de guías locales',
  },
  {
    id: 'usuarios',
    group: 'Comunidad',
    label: 'Usuarios',
    icon: UserCircle,
    path: '/admin/usuarios',
    enabled: true,
    description: 'Turistas y churres registrados',
  },
  {
    id: 'hoy-en-piura',
    group: 'Contenido',
    label: 'Hoy en Piura',
    icon: Sun,
    path: '/admin/hoy-en-piura',
    enabled: true,
    description: 'Feed del día: clima, eventos, alertas',
  },
  {
    id: 'resenas',
    group: 'Comunidad',
    label: 'Reseñas',
    icon: Star,
    path: '/admin/resenas',
    enabled: true,
    description: 'Moderación de reseñas',
  },
  {
    id: 'categorias',
    group: 'Catálogo',
    label: 'Categorías',
    icon: Tag,
    path: '/admin/categorias',
    enabled: true,
    description: 'Categorías y zonas de Piura',
  },
  {
    id: 'configuracion',
    group: 'Sistema',
    label: 'Configuración',
    icon: Settings,
    path: '/admin/configuracion',
    enabled: true,
    description: 'Settings globales de la plataforma',
  },
  {
    id: 'qr',
    group: 'Catálogo',
    label: 'Códigos QR',
    icon: QrCode,
    path: '/admin/qr',
    enabled: true,
    description: 'Genera e imprime QR para locales aliados',
  },
  {
    id: 'historia',
    group: 'Contenido',
    label: 'Biblioteca',
    icon: BookOpen,
    path: '/admin/historia',
    enabled: true,
    description: 'Crear y editar historias',
  }
]
