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
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    enabled: true,
    description: 'Métricas generales de la plataforma',
  },
  {
    id: 'spots',
    label: 'Spots',
    icon: MapPin,
    path: '/admin/spots',
    enabled: true,
    badge: 3,
    description: 'Gestión y aprobación de spots',
  },
  {
    id: 'tiktoks',
    label: 'TikToks',
    icon: Video,
    path: '/admin/tiktoks',
    enabled: true,
    description: 'Videos de TikTok por spot',
  },
  {
    id: 'churres',
    label: 'Churres',
    icon: Users,
    path: '/admin/churres',
    enabled: true,
    badge: 1,
    description: 'Verificación de guías locales',
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: UserCircle,
    path: '/admin/usuarios',
    enabled: true,
    description: 'Turistas y churres registrados',
  },
  {
    id: 'hoy-en-piura',
    label: 'Hoy en Piura',
    icon: Sun,
    path: '/admin/hoy-en-piura',
    enabled: true,
    description: 'Feed del día: clima, eventos, alertas',
  },
  {
    id: 'resenas',
    label: 'Reseñas',
    icon: Star,
    path: '/admin/resenas',
    enabled: true,
    description: 'Moderación de reseñas',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    icon: Tag,
    path: '/admin/categorias',
    enabled: true,
    description: 'Categorías y zonas de Piura',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    path: '/admin/configuracion',
    enabled: true,
    description: 'Settings globales de la plataforma',
  },
  {
    id: 'qr',
    label: 'Códigos QR',
    icon: QrCode,
    path: '/admin/qr',
    enabled: true,
    description: 'Genera e imprime QR para locales aliados',
  },
  {
    id: 'historia',
    label: 'Biblioteca',
    icon: BookOpen,
    path: '/admin/historia',
    enabled: true,
    description: 'Crear y editar historias'
  }
]
