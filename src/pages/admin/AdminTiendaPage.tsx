import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Check, X, RefreshCw, BadgeCheck, Phone, Sparkles, Film, Inbox, ShoppingBag, Users } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import StatusBadge from '../../components/admin/StatusBadge'
import { supabase } from '../../lib/supabase'
import { useUIStore } from '../../stores/useUIStore'

/*
 * Tienda Burrito · moderación del marketplace. Los artesanos suben fotos y
 * videos desde la app, la IA escribe la ficha y crea un video; aquí el admin
 * revisa y publica (market_review_product) o devuelve con una nota.
 * El admin lee market_products / market_sellers por RLS (market_is_admin).
 */

interface Media { path: string; type: 'image' | 'video' }
interface Seller {
  id: string
  business_name: string
  owner_name: string
  whatsapp: string
  district: string | null
  craft: string | null
  bio: string | null
  verified: boolean
  created_at: string
  email?: string | null
  published?: number
  pending?: number
}
interface Product {
  id: string
  seller_id: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  title: string | null
  tagline: string | null
  description: string | null
  story: string | null
  category: string | null
  materials: string[]
  tags: string[]
  price_pen: number | null
  stock: number | null
  media: Media[]
  ai_text_status: string
  ai_suggestion: { price_min?: number | null; price_max?: number | null } | null
  ai_video_status: string
  ai_video_path: string | null
  review_note: string | null
  updated_at: string
  seller: Seller | null
}

type Tab = 'revisar' | 'publicados' | 'otros' | 'vendedores'

const STATUS: Record<Product['status'], string> = {
  draft: 'Borrador',
  pending_review: 'Pendiente',
  published: 'Publicado',
  rejected: 'Rechazado',
  archived: 'Archivado',
}

const CATEGORY: Record<string, string> = {
  artesania: '🧺 Artesanía', textil: '🧵 Textil', ceramica: '🏺 Cerámica', joyeria: '💍 Joyería',
  gastronomia: '🍯 Sabores', decoracion: '🪴 Decoración', experiencia: '🧭 Experiencias', otros: '✨ Otros',
}

const mediaUrl = (path: string) => supabase.storage.from('market-media').getPublicUrl(path).data.publicUrl
const soles = (v: number | null | undefined) => (v == null ? '—' : `S/ ${Number(v).toFixed(2).replace(/\.00$/, '')}`)

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

const fetchAll = () => Promise.all([
  supabase.from('market_products').select('*, seller:market_sellers(*)').neq('status', 'archived').order('updated_at', { ascending: false }),
  supabase.rpc('market_admin_sellers'),
])

const card: React.CSSProperties = {
  background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px',
}

export default function AdminTiendaPage() {
  const { addToast } = useUIStore()
  const [products, setProducts] = useState<Product[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('revisar')
  const [busy, setBusy] = useState<string | null>(null)

  // El estado se toca en el callback de la respuesta, no de forma síncrona en el efecto.
  const apply = useCallback(([p, s]: Awaited<ReturnType<typeof fetchAll>>) => {
    if (p.error || s.error) addToast({ type: 'error', message: 'No se pudo cargar la Tienda' })
    setProducts((p.data ?? []) as Product[])
    setSellers((s.data ?? []) as Seller[])
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    let alive = true
    fetchAll().then(res => { if (alive) apply(res) })
    return () => { alive = false }
  }, [apply])
  const load = () => fetchAll().then(apply)
  const reload = () => { setLoading(true); load() }

  const review = async (p: Product, approve: boolean, note?: string) => {
    setBusy(p.id)
    const { error } = await supabase.rpc('market_review_product', { p_id: p.id, p_approve: approve, p_note: note ?? null })
    setBusy(null)
    if (error) return addToast({ type: 'error', message: 'No se pudo guardar la revisión' })
    addToast({ type: approve ? 'success' : 'info', message: approve ? `"${p.title}" ya está en la Tienda` : 'Devuelto al vendedor con tu nota' })
    load()
  }

  const verify = async (s: Seller) => {
    setBusy(s.id)
    const { error } = await supabase.rpc('market_verify_seller', { p_seller: s.id, p_verified: !s.verified })
    setBusy(null)
    if (error) return addToast({ type: 'error', message: 'No se pudo actualizar al vendedor' })
    load()
  }

  const pending = useMemo(() => products.filter(p => p.status === 'pending_review'), [products])
  const published = useMemo(() => products.filter(p => p.status === 'published'), [products])
  const others = useMemo(() => products.filter(p => p.status === 'draft' || p.status === 'rejected'), [products])
  const list = tab === 'revisar' ? pending : tab === 'publicados' ? published : others

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Tienda · Artesanos</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
            Revisa lo que suben los vendedores antes de que aparezca en la app
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading} style={{ gap: '6px' }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        <AdminStatCard icon={Inbox} value={pending.length} label="Por revisar" subType={pending.length ? 'warning' : 'success'} sub={pending.length ? 'Esperan tu respuesta' : 'Al día'} />
        <AdminStatCard icon={ShoppingBag} value={published.length} label="Publicados" />
        <AdminStatCard icon={Users} value={sellers.length} label="Vendedores" sub={`${sellers.filter(s => s.verified).length} verificados`} />
        <AdminStatCard icon={Film} value={products.filter(p => p.ai_video_path).length} label="Con video IA" />
      </div>

      <div style={{ display: 'flex', gap: '4px', background: 'var(--dim)', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {([
          ['revisar', `Por revisar (${pending.length})`],
          ['publicados', `Publicados (${published.length})`],
          ['otros', `Borradores y rechazados (${others.length})`],
          ['vendedores', `Vendedores (${sellers.length})`],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: tab === key ? 'var(--card2)' : 'transparent',
            color: tab === key ? 'var(--orange)' : 'var(--gray)',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {loading && products.length === 0 && <p style={{ color: 'var(--gray)' }}>Cargando…</p>}

      {tab === 'vendedores' ? (
        sellers.length === 0 ? (
          <AdminEmptyState icon={Store} title="Sin vendedores todavía" subtitle="Se registran desde la app: Tienda → Vender en Burrito." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {sellers.map(s => (
              <div key={s.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(45deg, #ff9a3c, #e8590c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 19,
                  }}>{s.business_name[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--white)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.business_name} {s.verified && <BadgeCheck size={16} color="var(--orange)" />}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)' }}>{s.owner_name} · {[s.craft, s.district].filter(Boolean).join(' · ') || 'Piura'}</p>
                  </div>
                </div>
                {s.bio && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s.bio}</p>}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--gray)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span><strong style={{ color: 'var(--white)' }}>{s.published ?? 0}</strong> publicados</span>
                  <span><strong style={{ color: 'var(--white)' }}>{s.pending ?? 0}</strong> por revisar</span>
                  <span style={{ marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" disabled={busy === s.id} onClick={() => verify(s)} style={{
                    flex: 1, justifyContent: 'center', border: 'none',
                    background: s.verified ? 'var(--dim)' : 'var(--orange)', color: s.verified ? 'var(--gray)' : 'white',
                  }}>
                    <BadgeCheck size={15} /> {s.verified ? 'Quitar verificado' : 'Marcar verificado'}
                  </button>
                  <a className="btn btn-ghost btn-sm" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" title="WhatsApp">
                    <Phone size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : list.length === 0 ? (
        <AdminEmptyState
          icon={tab === 'revisar' ? Inbox : ShoppingBag}
          title={tab === 'revisar' ? 'Nada por revisar' : 'Nada por aquí'}
          subtitle={tab === 'revisar' ? 'Cuando un vendedor envíe un producto a revisión, aparecerá aquí.' : 'Todavía no hay productos en este estado.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map(p => <ProductReview key={p.id} p={p} busy={busy === p.id} onReview={review} />)}
        </div>
      )}
    </motion.div>
  )
}

function ProductReview({ p, busy, onReview }: { p: Product; busy: boolean; onReview: (p: Product, approve: boolean, note?: string) => void }) {
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const s = p.seller
  const sug = p.ai_suggestion

  return (
    <div style={{ ...card, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {/* Medios: video IA primero, luego fotos y videos del vendedor. */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '100%', flex: '1 1 320px', alignItems: 'flex-start' }}>
        {p.ai_video_path && (
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <video src={mediaUrl(p.ai_video_path)} controls muted loop playsInline
              style={{ width: 150, height: 266, objectFit: 'cover', borderRadius: 12, background: '#000' }} />
            <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 700, color: 'white', background: 'rgba(0,0,0,.55)', padding: '2px 7px', borderRadius: 99 }}>
              ✨ Video IA
            </span>
          </div>
        )}
        {p.media.map(m => m.type === 'video' ? (
          <video key={m.path} src={mediaUrl(m.path)} controls muted playsInline
            style={{ flex: '0 0 auto', width: 150, height: 200, objectFit: 'cover', borderRadius: 12, background: '#000' }} />
        ) : (
          <a key={m.path} href={mediaUrl(m.path)} target="_blank" rel="noreferrer" style={{ flex: '0 0 auto' }}>
            <img src={mediaUrl(m.path)} alt="" style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 12 }} />
          </a>
        ))}
      </div>

      <div style={{ flex: '2 1 360px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--white)', margin: 0 }}>{p.title ?? 'Sin nombre'}</h3>
            {p.tagline && <p style={{ margin: '2px 0 0', color: 'var(--orange)', fontSize: 13, fontWeight: 600 }}>{p.tagline}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--white)', fontSize: 18 }}>{soles(p.price_pen)}</span>
            <StatusBadge status={STATUS[p.status]} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--gray)' }}>
          {p.category && <span>{CATEGORY[p.category] ?? p.category}</span>}
          {p.stock != null && <span>· stock {p.stock}</span>}
          {sug?.price_min != null && <span>· IA sugirió {soles(sug.price_min)}–{soles(sug.price_max)}</span>}
          {p.ai_text_status === 'done' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>· <Sparkles size={11} /> ficha escrita con IA</span>}
          <span>· {timeAgo(p.updated_at)}</span>
        </div>

        {p.description && <p style={{ margin: 0, fontSize: 14, color: 'var(--white)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{p.description}</p>}
        {p.story && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, borderLeft: '3px solid var(--orange)', paddingLeft: 10 }}>
            {p.story}
          </p>
        )}
        {p.materials.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.materials.map(m => (
              <span key={m} style={{ fontSize: 11, background: 'var(--dim)', color: 'var(--gray)', padding: '2px 8px', borderRadius: 6 }}>{m}</span>
            ))}
          </div>
        )}

        {s && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <Store size={14} />
            <span style={{ color: 'var(--white)', fontWeight: 600 }}>{s.business_name}</span>
            {s.verified && <BadgeCheck size={14} color="var(--orange)" />}
            <span>· {s.owner_name}{s.district ? ` · ${s.district}` : ''}</span>
            <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'var(--orange)' }}>WhatsApp</a>
          </div>
        )}

        {p.review_note && p.status === 'rejected' && (
          <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>Nota enviada: {p.review_note}</p>
        )}

        {p.status === 'pending_review' && (
          rejecting ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={note} onChange={e => setNote(e.target.value)} rows={2} autoFocus
                placeholder="Qué debe corregir (lo verá el vendedor en la app)"
                style={{ background: 'var(--dim)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--white)', fontFamily: 'var(--font-body)', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" disabled={busy || note.trim().length < 4}
                  style={{ background: '#ef4444' }} onClick={() => onReview(p, false, note.trim())}>
                  <X size={15} /> Devolver con nota
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onReview(p, true)}
                style={{ flex: 1, justifyContent: 'center', background: '#22c55e' }}>
                <Check size={15} /> Aprobar y publicar
              </button>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setRejecting(true)}
                style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }}>
                <X size={15} /> Pedir cambios
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
