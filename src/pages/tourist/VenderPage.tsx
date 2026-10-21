import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BadgeCheck, Film, Pencil, Play, Plus, Sparkles, X } from 'lucide-react'
import {
  HERO_GRADIENT, LoopingVideo, StatusPill,
} from '../../components/market/MarketParts'
import '../../components/market/market.css'
import {
  MARKET_CATEGORIES, MAX_AI_VIDEOS, MAX_IMAGES, MAX_VIDEOS, MarketError, cover, displayTitle, formatPrice, marketService, mediaUrl,
  type MarketMedia, type MarketProduct, type MarketSeller,
} from '../../services/market'

/**
 * "Vender en Burrito" — espejo de market/SellerScreens.kt + SellerViewModel.kt.
 * El artesano o emprendedor arma su perfil, sube fotos/videos y la IA le
 * escribe la ficha y le crea un video. Luego lo envía a revisión y, aprobado,
 * aparece en la Tienda.
 */

type Stage = 'loading' | 'onboarding' | 'hub' | 'editor'
interface Upload { id: string; preview: string; isVideo: boolean; failed?: boolean }

const CRAFTS = ['Artesanía', 'Textil', 'Cerámica', 'Joyería', 'Gastronomía', 'Turismo', 'Otro']
const ORDER: Stage[] = ['loading', 'onboarding', 'hub', 'editor']
const errText = (e: unknown) => (e instanceof MarketError ? e.message : 'Algo falló, revisa tu conexión')

export default function VenderPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('loading')
  const [prevStage, setPrevStage] = useState<Stage>('loading')
  const [seller, setSeller] = useState<MarketSeller | null>(null)
  const [products, setProducts] = useState<MarketProduct[]>([])
  const [editing, setEditing] = useState<MarketProduct | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiWriting, setAiWriting] = useState(false)
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null)
  const newInput = useRef<HTMLInputElement>(null)
  const moreInput = useRef<HTMLInputElement>(null)
  const editingRef = useRef<MarketProduct | null>(null)
  editingRef.current = editing
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty

  const go = (s: Stage) => { setPrevStage(stage); setStage(s) }
  const say = (text: string, error = false) => setToast({ text, error })

  const refresh = useCallback(async () => {
    setProducts(await marketService.myProducts().catch(() => []))
  }, [])

  useEffect(() => {
    marketService.mySeller().then(s => {
      setSeller(s)
      setStage(s ? 'hub' : 'onboarding')
      if (s) refresh()
    }).catch(() => setStage('onboarding'))
  }, [refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.error ? 5000 : 3200)
    return () => clearTimeout(t)
  }, [toast])

  // ── Video IA: se consulta el producto cada pocos segundos mientras se crea ──
  const videoRunning = editing?.ai_video_status === 'running'
  useEffect(() => {
    if (!videoRunning || !editing) return
    const id = editing.id
    const timer = setInterval(async () => {
      const fresh = await marketService.product(id).catch(() => null)
      if (!fresh || editingRef.current?.id !== id) return
      setEditing(e => e && {
        ...e, ai_video_status: fresh.ai_video_status, ai_video_path: fresh.ai_video_path,
        ai_video_error: fresh.ai_video_error, ai_video_count: fresh.ai_video_count,
      })
      if (fresh.ai_video_status === 'done') say('¡Tu video está listo!')
    }, 6000)
    return () => clearInterval(timer)
  }, [videoRunning, editing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Archivos ──

  /** Filtra lo elegido según los límites (8 fotos, 2 videos). */
  const pick = (files: File[], existing: MarketMedia[]) => {
    let images = existing.filter(m => m.type === 'image').length
    let videos = existing.filter(m => m.type === 'video').length
    const out: File[] = []
    let skipped = false
    for (const f of files) {
      const isVideo = f.type.startsWith('video/')
      if (isVideo && videos < MAX_VIDEOS) { videos++; out.push(f) }
      else if (!isVideo && f.type.startsWith('image/') && images < MAX_IMAGES) { images++; out.push(f) }
      else skipped = true
    }
    if (skipped) say(`Máximo ${MAX_IMAGES} fotos y ${MAX_VIDEOS} videos por producto`, true)
    return out
  }

  const uploadAll = async (productId: string, files: File[]) => {
    const queued: Upload[] = files.map(f => ({ id: crypto.randomUUID(), preview: URL.createObjectURL(f), isVideo: f.type.startsWith('video/') }))
    setUploads(u => [...u, ...queued])
    const media: MarketMedia[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        media.push(await marketService.upload(productId, files[i]))
        setUploads(u => u.filter(x => x.id !== queued[i].id))
      } catch (e) {
        setUploads(u => u.map(x => (x.id === queued[i].id ? { ...x, failed: true } : x)))
        say(errText(e), true)
      }
    }
    return media
  }

  /** Fotos/videos para un producto NUEVO: subir, crear y pedir la ficha a la IA. */
  const createFrom = async (all: File[]) => {
    const files = pick(all, [])
    if (!files.length) return
    const id = crypto.randomUUID()
    setEditing(null); setDirty(false); setUploads([]); go('editor')
    const media = await uploadAll(id, files)
    if (!media.length) return say('No se pudo subir ningún archivo, revisa tu conexión', true)
    try {
      const created = await marketService.createProduct(id, media)
      setEditing(created)
      writeWithAi(created, false)
    } catch (e) { say(errText(e), true) }
  }

  const addMedia = async (all: File[]) => {
    const p = editing
    if (!p) return
    const files = pick(all, p.media)
    if (!files.length) return
    const media = await uploadAll(p.id, files)
    setEditing(e => e && { ...e, media: [...e.media, ...media] })
    setDirty(true)
  }

  const edit = (change: Partial<MarketProduct>) => {
    setEditing(e => e && { ...e, ...change })
    setDirty(true)
  }

  // ── IA ──

  const writeWithAi = async (p: MarketProduct | null = editing, wasDirty = dirty) => {
    if (!p) return
    setAiWriting(true)
    try {
      // Lo que el vendedor ya cambió (fotos) se guarda antes de que la IA mire.
      if (wasDirty && editingRef.current) await marketService.updateProduct(editingRef.current)
      const written = await marketService.aiDescribe(p.id)
      setEditing(e => ({ ...written, media: e?.media ?? written.media }))
      setDirty(false)
      say('La IA escribió tu ficha. Revísala y ajusta lo que quieras.')
    } catch (e) {
      say(errText(e), true)
      const fresh = await marketService.product(p.id).catch(() => null)
      if (fresh) setEditing(cur => cur && { ...cur, ai_text_status: fresh.ai_text_status, ai_text_error: fresh.ai_text_error })
    } finally {
      setAiWriting(false)
    }
  }

  const createVideo = async () => {
    const p = editing
    if (!p) return
    try {
      if (dirty) { setEditing(await marketService.updateProduct(p)); setDirty(false) }
      await marketService.aiVideoStart(p.id)
      setEditing(e => e && { ...e, ai_video_status: 'running', ai_video_error: null, ai_video_count: e.ai_video_count + 1 })
    } catch (e) { say(errText(e), true) }
  }

  // ── Guardar / enviar ──

  const save = async (thenSubmit = false) => {
    const p = editing
    if (!p) return
    setSaving(true)
    try {
      let saved = await marketService.updateProduct(p)
      if (thenSubmit) saved = await marketService.submit(p.id)
      setEditing(saved); setDirty(false)
      say(thenSubmit ? '¡Enviado! El equipo Burrito lo revisa y te avisamos.' : 'Cambios guardados')
      if (thenSubmit) closeEditor(true)
    } catch (e) { say(errText(e), true) } finally { setSaving(false) }
  }

  /** Sale del editor; lo que quedó sin guardar se guarda en el camino. */
  const closeEditor = (skipSave = false) => {
    const pending = !skipSave && dirtyRef.current ? editingRef.current : null
    setEditing(null); setUploads([]); setDirty(false); go('hub')
    ;(pending ? marketService.updateProduct(pending).catch(() => null) : Promise.resolve()).then(refresh)
  }

  const archive = async () => {
    if (!editing || !confirm('¿Archivar este producto? Dejará de verse en la Tienda.')) return
    try { await marketService.archive(editing.id); closeEditor(true) } catch (e) { say(errText(e), true) }
  }

  const forward = ORDER.indexOf(stage) >= ORDER.indexOf(prevStage)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
      <input ref={newInput} type="file" accept="image/*,video/*" multiple hidden
        onChange={e => { createFrom(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      <input ref={moreInput} type="file" accept="image/*,video/*" multiple hidden
        onChange={e => { addMedia(Array.from(e.target.files ?? [])); e.target.value = '' }} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: forward ? 60 : -60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: forward ? -30 : 30 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          style={{ maxWidth: 640, margin: '0 auto', padding: '16px 20px 0' }}
        >
          {stage === 'loading' && <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="mk-spinner dark" style={{ width: 30, height: 30 }} /></div>}
          {stage === 'onboarding' && (
            <Onboarding
              seller={seller} saving={saving}
              onBack={() => (seller ? go('hub') : navigate('/app/tienda'))}
              onSave={async form => {
                setSaving(true)
                try { const s = await marketService.saveSeller(form); setSeller(s); go('hub'); refresh() }
                catch (e) { say(errText(e), true) } finally { setSaving(false) }
              }}
            />
          )}
          {stage === 'hub' && seller && (
            <Hub
              seller={seller} products={products}
              onBack={() => navigate('/app/tienda')} onEditProfile={() => go('onboarding')}
              onNew={() => newInput.current?.click()}
              onOpen={p => { setEditing(p); setUploads([]); setDirty(false); go('editor') }}
            />
          )}
          {stage === 'editor' && (
            <Editor
              p={editing} uploads={uploads} aiWriting={aiWriting}
              onBack={() => closeEditor()} onAddMedia={() => moreInput.current?.click()}
              onEdit={edit} onRewrite={() => writeWithAi()} onVideo={createVideo} onArchive={archive}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Acciones fijas abajo en el editor. */}
      {stage === 'editor' && editing && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--card)', borderTop: '1px solid var(--border)', padding: '12px 16px calc(12px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 10 }}>
            {(() => {
              const canSubmit = editing.status === 'draft' || editing.status === 'rejected'
              return (
                <>
                  <button className="mk-btn outline" style={{ flex: canSubmit ? 0.8 : 1 }} disabled={saving || !dirty} onClick={() => save()}>Guardar</button>
                  {canSubmit && (
                    <button className="mk-btn" style={{ flex: 1.2 }} onClick={() => save(true)}
                      disabled={saving || aiWriting || !editing.title || !editing.description || editing.price_pen == null}>
                      {saving ? <span className="mk-spinner" style={{ width: 20, height: 20 }} /> : 'Enviar a revisión'}
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            style={{ position: 'fixed', left: 16, right: 16, bottom: stage === 'editor' ? 96 : 96, zIndex: 7000, display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              maxWidth: 520, width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 16,
              background: toast.error ? '#3A1D14' : '#1A120A', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,.3)', fontFamily: 'var(--font-body)', fontSize: 13.5,
            }}>
              <span>{toast.error ? '⚠️' : '✨'}</span>
              <span style={{ flex: 1 }}>{toast.text}</span>
              <button onClick={() => setToast(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={17} color="rgba(255,255,255,.7)" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================ piezas

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Atrás" style={{
      width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--card)', boxShadow: 'var(--shadow-card)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    }}>
      <ArrowLeft size={21} color="var(--white)" />
    </button>
  )
}

function Title({ children, size = 22, color = 'var(--white)', style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) {
  return <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '-0.4px', lineHeight: `${size + 4}px`, color, margin: 0, ...style }}>{children}</h2>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block' }}><span className="mk-label">{label}</span>{children}</label>
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'color-mix(in srgb, var(--orange) 14%, transparent)', color: 'var(--orange)', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>{n}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14.5, color: 'var(--white)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '18px', color: 'var(--muted)' }}>{body}</div>
      </div>
    </div>
  )
}

function Notice({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '18px', color: 'var(--white)', marginTop: 2 }}>{body}</div>
    </div>
  )
}

// ============================================================ Perfil

function Onboarding({ seller, saving, onBack, onSave }: {
  seller: MarketSeller | null
  saving: boolean
  onBack: () => void
  onSave: (f: { business: string; owner: string; whatsapp: string; district: string; craft: string; bio: string }) => void
}) {
  const [business, setBusiness] = useState(seller?.business_name ?? '')
  const [owner, setOwner] = useState(seller?.owner_name ?? '')
  const [whatsapp, setWhatsapp] = useState(seller?.whatsapp?.replace(/^51/, '') ?? '')
  const [district, setDistrict] = useState(seller?.district ?? '')
  const [craft, setCraft] = useState(seller?.craft ?? '')
  const [bio, setBio] = useState(seller?.bio ?? '')
  const valid = business.trim().length >= 2 && owner.trim().length >= 2 && whatsapp.replace(/\D/g, '').length === 9

  return (
    <div>
      <BackButton onClick={onBack} />
      <div style={{ height: 18 }} />
      {!seller ? (
        <>
          <div style={{ padding: 22, borderRadius: 26, background: HERO_GRADIENT }}>
            <div style={{ fontSize: 26 }}>🏺 🧵 🍯</div>
            <Title size={26} color="white" style={{ marginTop: 10 }}>Vende lo tuyo en Burrito</Title>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: '19px', color: 'rgba(255,255,255,.92)', margin: '6px 0 0' }}>
              Tus artesanías y productos frente a los turistas que llegan a Piura.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
            <Step n="1" title="Sube fotos o videos" body="Con tu celular, como los tomes. Nada más." />
            <Step n="2" title="La IA hace el resto" body="Escribe el nombre, la descripción y la historia, sugiere un precio y crea un video de tu producto." />
            <Step n="3" title="Revisamos y publicamos" body="El equipo Burrito lo revisa y aparece en la Tienda. Los pedidos te llegan por WhatsApp." />
          </div>
          <Title size={19} style={{ marginTop: 26 }}>Tu perfil de vendedor</Title>
        </>
      ) : (
        <Title size={24}>Editar mi perfil</Title>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <Field label="Nombre de tu negocio o taller">
          <input className="mk-field" value={business} onChange={e => setBusiness(e.target.value)} placeholder="Ej. Filigrana Doña Rosa" maxLength={80} />
        </Field>
        <Field label="Tu nombre">
          <input className="mk-field" value={owner} onChange={e => setOwner(e.target.value)} maxLength={80} autoCapitalize="words" />
        </Field>
        <Field label="WhatsApp para pedidos">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--white)', fontSize: 15 }}>+51</span>
            <input className="mk-field" style={{ paddingLeft: 52 }} inputMode="tel" value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="9XX XXX XXX" />
          </div>
          <span className="mk-label" style={{ margin: '4px 0 0 2px', fontWeight: 400 }}>Aquí te escriben los compradores</span>
        </Field>
        <Field label="Distrito o lugar">
          <input className="mk-field" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Ej. Catacaos" maxLength={60} />
        </Field>
      </div>

      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--white)', margin: '16px 0 8px' }}>¿Qué haces?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CRAFTS.map(c => (
          <button key={c} className={`mk-chip ${craft === c ? 'on' : ''}`} onClick={() => setCraft(craft === c ? '' : c)}>{c}</button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Cuéntanos de ti (opcional)">
          <textarea className="mk-field" rows={3} maxLength={500} value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Ej. Tejo sombreros de paja toquilla desde hace 20 años, como mi mamá." />
        </Field>
      </div>

      <button className="mk-btn" style={{ width: '100%', marginTop: 22 }} disabled={!valid || saving}
        onClick={() => onSave({ business: business.trim(), owner: owner.trim(), whatsapp, district, craft, bio })}>
        {saving ? <span className="mk-spinner" style={{ width: 20, height: 20 }} /> : seller ? 'Guardar' : 'Crear mi tienda'}
      </button>
    </div>
  )
}

// ============================================================ Mi tienda

function Hub({ seller, products, onBack, onEditProfile, onNew, onOpen }: {
  seller: MarketSeller
  products: MarketProduct[]
  onBack: () => void
  onEditProfile: () => void
  onNew: () => void
  onOpen: (p: MarketProduct) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BackButton onClick={onBack} />
        <Title size={24}>Mi tienda</Title>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: HERO_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
          {seller.business_name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seller.business_name}</span>
            {seller.verified && <BadgeCheck size={16} color="var(--orange)" />}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--muted)' }}>
            {[seller.craft, seller.district].filter(Boolean).join(' · ') || 'Vendedor Burrito'}
          </div>
        </div>
        <button onClick={onEditProfile} aria-label="Editar perfil" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <Pencil size={19} color="var(--muted)" />
        </button>
      </div>

      <motion.button whileTap={{ scale: 0.98 }} onClick={onNew} style={{
        textAlign: 'left', padding: 20, borderRadius: 24, border: 'none', cursor: 'pointer', background: HERO_GRADIENT, boxShadow: 'var(--shadow-glow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 18, color: 'white' }}>
          <Sparkles size={20} color="white" /> Subir un producto
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: '18px', color: 'rgba(255,255,255,.92)', marginTop: 6 }}>
          Elige fotos o videos. La IA escribe la ficha y te ayuda con el video.
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '9px 16px', borderRadius: 99, background: 'white', color: 'var(--orange)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>
          <Plus size={18} /> Elegir fotos y videos
        </span>
      </motion.button>

      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginTop: 8 }}>
        {products.length ? `Mis productos (${products.length})` : 'Todavía no tienes productos'}
      </div>
      {products.map(p => (
        <motion.button key={p.id} whileTap={{ scale: 0.98 }} onClick={() => onOpen(p)} className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, cursor: 'pointer', textAlign: 'left' }}>
          <Thumb m={cover(p) ?? p.media[0] ?? null} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14.5, color: 'var(--white)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayTitle(p)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill status={p.status} />
              {p.price_pen != null && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--orange)' }}>{formatPrice(p.price_pen)}</span>}
              {p.ai_video_path && <span style={{ fontSize: 12 }}>🎬</span>}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

function Thumb({ m, size, height }: { m: MarketMedia | null; size: number | string; height?: number | string }) {
  return (
    <div style={{ width: size, height: height ?? size, borderRadius: 14, overflow: 'hidden', background: m?.type === 'video' ? '#1A120A' : 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {!m ? <span style={{ fontSize: 24 }}>📦</span>
        : m.type === 'video' ? <Play size={26} color="white" fill="white" />
        : <img src={mediaUrl(m.path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  )
}

// ============================================================ Editor

function Editor({ p, uploads, aiWriting, onBack, onAddMedia, onEdit, onRewrite, onVideo, onArchive }: {
  p: MarketProduct | null
  uploads: Upload[]
  aiWriting: boolean
  onBack: () => void
  onAddMedia: () => void
  onEdit: (c: Partial<MarketProduct>) => void
  onRewrite: () => void
  onVideo: () => void
  onArchive: () => void
}) {
  const coverPath = p ? cover(p)?.path : undefined
  const tile: React.CSSProperties = { flex: '0 0 auto', width: 96, height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BackButton onClick={onBack} />
        <Title size={22} style={{ flex: 1 }}>{p ? 'Tu producto' : 'Nuevo producto'}</Title>
        {p && <StatusPill status={p.status} />}
      </div>

      {p?.status === 'rejected' && p.review_note && <Notice title="Hay que corregir algo" body={p.review_note} color="#D14B3A" />}
      {p?.status === 'pending_review' && <Notice title="En revisión" body="El equipo Burrito lo está revisando. Te avisamos cuando se publique." color="#B7791F" />}
      {p?.status === 'published' && <Notice title="Publicado en la Tienda" body="Si cambias algo, vuelve a revisión antes de mostrarse." color="#2E9E5B" />}

      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginTop: 16 }}>Fotos y videos</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>Toca una foto para hacerla portada</div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 0 4px', scrollbarWidth: 'none' }}>
        {p?.media.map(m => (
          <div key={m.path} style={{ ...tile, outline: m.path === coverPath ? '2.5px solid var(--orange)' : 'none', outlineOffset: -2.5 }}>
            <button onClick={() => m.type === 'image' && onEdit({ media: [m, ...p.media.filter(x => x !== m)] })}
              style={{ border: 'none', padding: 0, width: '100%', height: '100%', cursor: m.type === 'image' ? 'pointer' : 'default', background: 'none' }}>
              <Thumb m={m} size="100%" />
            </button>
            {m.path === coverPath && (
              <span style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 10, fontWeight: 700, color: 'white', background: 'var(--orange)', padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-body)' }}>Portada</span>
            )}
            <button onClick={() => onEdit({ media: p.media.filter(x => x !== m) })} aria-label="Quitar"
              style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} color="white" />
            </button>
          </div>
        ))}
        {uploads.map(u => (
          <div key={u.id} style={{ ...tile, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!u.isVideo && <img src={u.preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${u.failed ? 0.55 : 0.35})` }} />
            {u.failed
              ? <span style={{ position: 'relative', color: 'white', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>No se subió</span>
              : <span className="mk-spinner" style={{ position: 'relative', width: 24, height: 24 }} />}
          </div>
        ))}
        {p && (
          <button onClick={onAddMedia} style={{
            ...tile, border: '1.5px solid color-mix(in srgb, var(--orange) 50%, transparent)', background: 'color-mix(in srgb, var(--orange) 6%, transparent)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--orange)',
          }}>
            <Plus size={22} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>Agregar</span>
          </button>
        )}
      </div>

      <AiWriterCard p={p} writing={aiWriting} onRewrite={onRewrite} />

      {p && (
        <>
          <ProductFields key={`${p.id}-${p.ai_text_status}`} p={p} writing={aiWriting} onEdit={onEdit} />
          <AiVideoCard p={p} onVideo={onVideo} />
          <button onClick={onArchive} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 14, padding: '14px 4px', cursor: 'pointer' }}>
            Archivar este producto
          </button>
        </>
      )}
    </div>
  )
}

function AiWriterCard({ p, writing, onRewrite }: { p: MarketProduct | null; writing: boolean; onRewrite: () => void }) {
  const title = !p ? 'Subiendo tus archivos…' : writing ? 'La IA está mirando tus fotos…' : p.ai_text_status === 'done' ? 'Ficha escrita con IA' : 'Deja que la IA escriba la ficha'
  const body = !p ? 'En cuanto terminen, la IA empieza a escribir.'
    : writing ? 'Escribe el nombre, la descripción y la historia. Tarda unos segundos.'
    : p.ai_text_status === 'done' ? 'Revísala: tú conoces tu producto mejor que nadie.'
    : p.ai_text_error ?? 'Nombre, descripción, historia y precio sugerido.'
  return (
    <div className={writing || !p ? 'mk-shimmer' : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, padding: 14, borderRadius: 18,
      backgroundColor: 'color-mix(in srgb, var(--orange) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--orange) 25%, transparent)',
    }}>
      <Sparkles size={22} color="var(--orange)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: '17px', color: 'var(--muted)' }}>{body}</div>
      </div>
      {p && !writing && (
        <button onClick={onRewrite} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {p.ai_text_status === 'done' ? 'Reescribir' : 'Escribir'}
        </button>
      )}
    </div>
  )
}

function ProductFields({ p, writing, onEdit }: { p: MarketProduct; writing: boolean; onEdit: (c: Partial<MarketProduct>) => void }) {
  // Texto local para precio y materiales (se escriben a medias: "12.", "paja, ").
  // Se reinicia cuando la IA reescribe la ficha: el padre cambia la key.
  const [priceText, setPriceText] = useState(p.price_pen != null ? String(p.price_pen) : '')
  const [materialsText, setMaterialsText] = useState(p.materials.join(', '))
  const sug = p.ai_suggestion

  return (
    <div className={writing ? 'mk-shimmer' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
      <Field label="Nombre del producto">
        <input className="mk-field" value={p.title ?? ''} maxLength={90} onChange={e => onEdit({ title: e.target.value })} />
      </Field>
      <Field label="Frase corta">
        <input className="mk-field" value={p.tagline ?? ''} maxLength={120} placeholder="Lo que lo hace especial" onChange={e => onEdit({ tagline: e.target.value })} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Precio">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--white)' }}>S/</span>
              <input className="mk-field" style={{ paddingLeft: 40 }} inputMode="decimal" value={priceText}
                onChange={e => {
                  const clean = e.target.value.replace(/[^\d.]/g, '').slice(0, 8)
                  setPriceText(clean)
                  const n = parseFloat(clean)
                  onEdit({ price_pen: isFinite(n) && n >= 1 ? n : null })
                }} />
            </div>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Stock (opcional)">
            <input className="mk-field" inputMode="numeric" value={p.stock ?? ''}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); onEdit({ stock: v ? parseInt(v, 10) : null }) }} />
          </Field>
        </div>
      </div>
      {sug?.price_min != null && sug.price_max != null && (
        <button onClick={() => {
          const mid = Math.round((sug.price_min! + sug.price_max!) / 2)
          setPriceText(String(mid)); onEdit({ price_pen: mid })
        }} style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 99, border: 'none',
          background: 'var(--card2)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer',
        }}>
          <Sparkles size={14} color="var(--orange)" /> La IA sugiere {formatPrice(sug.price_min)} – {formatPrice(sug.price_max)} · usar
        </button>
      )}

      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginTop: 4 }}>Categoría</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {MARKET_CATEGORIES.map(c => (
          <button key={c.key} className={`mk-chip ${p.category === c.key ? 'on' : ''}`} onClick={() => onEdit({ category: c.key })}>{c.emoji} {c.label}</button>
        ))}
      </div>

      <Field label="Descripción">
        <textarea className="mk-field" rows={5} maxLength={1500} value={p.description ?? ''} onChange={e => onEdit({ description: e.target.value })} />
      </Field>
      <Field label="La historia detrás (opcional)">
        <textarea className="mk-field" rows={3} maxLength={1500} value={p.story ?? ''} onChange={e => onEdit({ story: e.target.value })} />
      </Field>
      <Field label="Materiales">
        <input className="mk-field" value={materialsText} placeholder="Ej. paja toquilla, tinte natural"
          onChange={e => {
            setMaterialsText(e.target.value)
            onEdit({ materials: e.target.value.split(',').map(m => m.trim().toLowerCase()).filter(Boolean).slice(0, 5) })
          }} />
      </Field>
    </div>
  )
}

function AiVideoCard({ p, onVideo }: { p: MarketProduct; onVideo: () => void }) {
  const left = Math.max(0, MAX_AI_VIDEOS - p.ai_video_count)
  const running = p.ai_video_status === 'running'
  const hasCover = !!cover(p)
  return (
    <div className="card" style={{ marginTop: 22, padding: 16, borderRadius: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Film size={20} color="var(--orange)" />
        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>Video con IA</span>
        {p.ai_video_count > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>Quedan {left}</span>}
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: '17px', color: 'var(--muted)', margin: '4px 0 12px' }}>
        Un clip vertical de unos segundos hecho a partir de tu foto de portada, para que tu producto luzca en la Tienda.
      </p>
      {running ? (
        <div className="mk-shimmer" style={{ height: 180, borderRadius: 16, backgroundColor: '#1A120A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span className="mk-spinner" style={{ width: 26, height: 26 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'white' }}>Creando tu video…</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,.75)', textAlign: 'center', padding: '0 16px' }}>Puede tardar 1 a 3 minutos. Puedes salir, sigue en marcha.</span>
        </div>
      ) : p.ai_video_path ? (
        <LoopingVideo src={mediaUrl(p.ai_video_path)} style={{ width: '62%', aspectRatio: '9 / 16', borderRadius: 18, margin: '0 auto' }} />
      ) : p.ai_video_status === 'failed' ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#D14B3A', margin: 0 }}>{p.ai_video_error ?? 'No se pudo crear el video'}</p>
      ) : null}
      {!running && (
        <button className="mk-btn ink" style={{ width: '100%', height: 48, marginTop: 12 }} disabled={!hasCover || left === 0} onClick={onVideo}>
          {!hasCover ? 'Agrega una foto para crear el video' : p.ai_video_path ? 'Crear otra versión' : 'Crear video con IA'}
        </button>
      )}
    </div>
  )
}
