import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Marketplace de la Tienda — espejo de market/MarketRepository.kt (app nativa).
 * Las tablas son de solo lectura para el cliente: toda escritura pasa por
 * RPC (market_*) y la IA por la Edge Function market-ai.
 * Ver supabase/migrations/20261021_market.sql.
 */

const BUCKET = 'market-media'

export interface MarketMedia { path: string; type: 'image' | 'video' }

export interface MarketSeller {
  id: string
  business_name: string
  owner_name: string
  whatsapp: string
  district: string | null
  craft: string | null
  bio: string | null
  verified: boolean
}

export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'

export interface MarketProduct {
  id: string
  seller_id: string
  status: ProductStatus
  title: string | null
  tagline: string | null
  description: string | null
  story: string | null
  category: string | null
  materials: string[]
  tags: string[]
  price_pen: number | null
  stock: number | null
  media: MarketMedia[]
  ai_text_status: 'idle' | 'running' | 'done' | 'failed'
  ai_text_error: string | null
  ai_suggestion: { price_min?: number | null; price_max?: number | null } | null
  ai_video_status: 'idle' | 'running' | 'done' | 'failed'
  ai_video_path: string | null
  ai_video_error: string | null
  ai_video_count: number
  review_note: string | null
  seller?: MarketSeller | null
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  rejected: 'Por corregir',
  archived: 'Archivado',
}

/** Las mismas categorías que valida la base de datos (y que usa la app). */
export const MARKET_CATEGORIES = [
  { key: 'artesania', label: 'Artesanía', emoji: '🧺' },
  { key: 'textil', label: 'Textil', emoji: '🧵' },
  { key: 'ceramica', label: 'Cerámica', emoji: '🏺' },
  { key: 'joyeria', label: 'Joyería', emoji: '💍' },
  { key: 'gastronomia', label: 'Sabores', emoji: '🍯' },
  { key: 'decoracion', label: 'Decoración', emoji: '🪴' },
  { key: 'experiencia', label: 'Experiencias', emoji: '🧭' },
  { key: 'otros', label: 'Otros', emoji: '✨' },
] as const

export const categoryOf = (key: string | null | undefined) => MARKET_CATEGORIES.find(c => c.key === key)

export const MAX_IMAGES = 8
export const MAX_VIDEOS = 2
export const MAX_AI_VIDEOS = 3
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const MAX_IMAGE_PX = 1600

export const cover = (p: MarketProduct) => p.media.find(m => m.type === 'image') ?? null
export const displayTitle = (p: MarketProduct) => p.title ?? 'Producto sin nombre'
export const hasVideo = (p: MarketProduct) => !!p.ai_video_path || p.media.some(m => m.type === 'video')
export const formatPrice = (v: number) => (v % 1 === 0 ? `S/ ${v}` : `S/ ${v.toFixed(2)}`)

export class MarketError extends Error {}

const MESSAGES: Record<string, string> = {
  WHATSAPP: 'Revisa tu WhatsApp: deben ser 9 dígitos y empezar con 9',
  NO_SELLER: 'Primero completa tu perfil de vendedor',
  MEDIA_EMPTY: 'Agrega al menos una foto o un video',
  MEDIA_LIMIT: 'Máximo 8 fotos y 2 videos por producto',
  INCOMPLETE: 'Falta el nombre, la descripción o el precio',
  NEED_PHOTO: 'Necesitas al menos una foto para publicar',
  TOO_MANY: 'Llegaste al máximo de productos activos',
  BAD_STATE: 'Este producto ya está en revisión',
}

function rpcError(error: { message?: string; details?: string } | null): never {
  const code = /MARKET:([A-Z_]+)/.exec(`${error?.message} ${error?.details}`)?.[1]
  throw new MarketError(MESSAGES[code ?? ''] ?? 'No se pudo guardar, intenta de nuevo')
}

async function rpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) rpcError(error)
  return data as T
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new MarketError('Inicia sesión')
  return data.user.id
}

export const mediaUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

export const marketService = {
  async catalog(): Promise<MarketProduct[]> {
    const { data } = await supabase
      .from('market_products')
      .select('*, seller:market_sellers(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(120)
    return (data ?? []) as MarketProduct[]
  },

  async mySeller(): Promise<MarketSeller | null> {
    const id = await uid()
    const { data } = await supabase.from('market_sellers').select('*').eq('id', id).maybeSingle()
    return (data as MarketSeller) ?? null
  },

  saveSeller(s: { business: string; owner: string; whatsapp: string; district: string; craft: string; bio: string }) {
    return rpc<MarketSeller>('market_upsert_seller', {
      p_business_name: s.business, p_owner_name: s.owner, p_whatsapp: s.whatsapp,
      p_district: s.district, p_craft: s.craft, p_bio: s.bio,
    })
  },

  async myProducts(): Promise<MarketProduct[]> {
    const id = await uid()
    const { data } = await supabase.from('market_products').select('*')
      .eq('seller_id', id).neq('status', 'archived').order('updated_at', { ascending: false })
    return (data ?? []) as MarketProduct[]
  },

  async product(id: string): Promise<MarketProduct | null> {
    const { data } = await supabase.from('market_products').select('*').eq('id', id).maybeSingle()
    return (data as MarketProduct) ?? null
  },

  /** Sube un archivo a <uid>/<producto>/<archivo>. Las fotos se achican a 1600 px en JPEG. */
  async upload(productId: string, file: File): Promise<MarketMedia> {
    const isVideo = file.type.startsWith('video/')
    if (isVideo && file.size > MAX_VIDEO_BYTES) throw new MarketError('Un video pesa más de 50 MB; elige uno más corto')
    const body = isVideo ? file : await compressImage(file)
    const ext = isVideo ? (file.type.includes('quicktime') ? 'mov' : file.type.includes('webm') ? 'webm' : 'mp4') : 'jpg'
    const path = `${await uid()}/${productId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: isVideo ? file.type || 'video/mp4' : 'image/jpeg' })
    if (error) throw new MarketError('Un archivo no se pudo subir')
    return { path, type: isVideo ? 'video' : 'image' }
  },

  createProduct: (id: string, media: MarketMedia[]) => rpc<MarketProduct>('market_create_product', { p_id: id, p_media: media }),

  updateProduct: (p: MarketProduct) => rpc<MarketProduct>('market_update_product', {
    p_id: p.id,
    p_title: p.title ?? '', p_tagline: p.tagline ?? '',
    p_description: p.description ?? '', p_story: p.story ?? '',
    p_category: p.category ?? '', p_materials: p.materials, p_tags: p.tags,
    p_price: p.price_pen, p_stock: p.stock, p_media: p.media,
  }),

  submit: (id: string) => rpc<MarketProduct>('market_submit_product', { p_id: id }),
  archive: (id: string) => rpc<void>('market_archive_product', { p_id: id }),

  /** La IA redacta la ficha a partir de las fotos. */
  async aiDescribe(id: string): Promise<MarketProduct> {
    const res = await ai<{ product: MarketProduct }>('describe', id)
    return res.product
  },

  /** Arranca el video con IA; termina en segundo plano (leer el producto para ver el estado). */
  aiVideoStart: (id: string) => ai('video_start', id),
}

async function ai<T>(action: string, productId: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke('market-ai', { body: { action, product_id: productId } })
  if (error) {
    let msg: string | undefined
    if (error instanceof FunctionsHttpError) {
      msg = await error.context.json().then((b: { error?: string }) => b.error).catch(() => undefined)
    }
    throw new MarketError(msg ?? 'La IA no está disponible ahora')
  }
  return data as T
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_IMAGE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new MarketError('No se pudo leer una foto'))), 'image/jpeg', 0.85),
  )
}
