import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCheck, Minus, Play, Plus, Volume2, VolumeX, X } from 'lucide-react'
import {
  categoryOf, cover, displayTitle, formatPrice, hasVideo, mediaUrl,
  type MarketProduct, type MarketSeller, type ProductStatus, STATUS_LABEL,
} from '../../services/market'
import './market.css'

/*
 * Piezas de la Tienda de artesanos — espejo de market/MarketStore.kt y
 * MarketComponents.kt de la app nativa (mismas tarjetas, ficha y textos).
 */

export const HERO_GRADIENT = 'linear-gradient(135deg, #FF9A3C 0%, #E8590C 100%)'
const SIGNATURE = '\n\n_Generado con Burrito · La guía piurana_ 🫏'

// ── Tarjetas ──────────────────────────────────────────────────────────────────

/** Tarjeta grande del carrusel "Hecho por artesanos": foto a sangre con degradado. */
export function MarketHeroCard({ p, onClick }: { p: MarketProduct; onClick: () => void }) {
  const c = cover(p)
  return (
    <motion.button
      whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{
        position: 'relative', width: 230, aspectRatio: '0.78', borderRadius: 24, overflow: 'hidden', border: 'none', padding: 0,
        background: 'var(--card2)', cursor: 'pointer', boxShadow: 'var(--shadow-card)', textAlign: 'left',
      }}
    >
      {c && <img src={mediaUrl(c.path)} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.78) 100%)' }} />
      {hasVideo(p) && <VideoBadge style={{ position: 'absolute', top: 12, right: 12 }} />}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        {p.seller && <SellerLine s={p.seller} color="rgba(255,255,255,0.85)" />}
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 18, lineHeight: '22px', color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {displayTitle(p)}
        </div>
        {p.price_pen != null && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#FFC27A', marginTop: 4 }}>{formatPrice(p.price_pen)}</div>}
      </div>
    </motion.button>
  )
}

/** Tarjeta de grilla para un producto de artesano. */
export function MarketGridCard({ p, onClick }: { p: MarketProduct; onClick: () => void }) {
  const c = cover(p)
  const cat = categoryOf(p.category)
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: 0, borderRadius: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '0.9', background: 'var(--card2)' }}>
        {c && <img src={mediaUrl(c.path)} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {hasVideo(p) && <VideoBadge style={{ position: 'absolute', top: 8, right: 8 }} />}
        {cat && (
          <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10.5, fontWeight: 700, color: '#1A120A', background: 'rgba(255,255,255,0.92)', padding: '3px 8px', borderRadius: 99, fontFamily: 'var(--font-body)' }}>
            {cat.emoji} {cat.label}
          </span>
        )}
      </div>
      <div style={{ padding: '10px 11px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, lineHeight: '17px', color: 'var(--white)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayTitle(p)}</div>
        {p.seller && <div style={{ marginTop: 3 }}><SellerLine s={p.seller} color="var(--muted)" /></div>}
        {p.price_pen != null && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--orange)', marginTop: 6 }}>{formatPrice(p.price_pen)}</div>}
      </div>
    </motion.button>
  )
}

function SellerLine({ s, color }: { s: MarketSeller; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.business_name}</span>
      {s.verified && <BadgeCheck size={12} color="var(--orange)" style={{ flexShrink: 0 }} />}
    </div>
  )
}

function VideoBadge({ style }: { style: React.CSSProperties }) {
  return (
    <span style={{ ...style, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Tiene video">
      <Play size={14} color="white" fill="white" />
    </span>
  )
}

/** Invitación a vender: aparece en la Tienda para artesanos y emprendedores. */
export function SellInviteCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }} onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 18, borderRadius: 24, border: 'none', cursor: 'pointer',
        background: '#1A120A', boxShadow: 'var(--shadow-card)', textAlign: 'left',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, color: 'white' }}>¿Eres artesano o emprendedor?</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: '17px', color: 'rgba(255,255,255,0.78)', marginTop: 4 }}>
          Sube fotos de lo que haces. La IA arma la ficha y un video, y tus productos llegan a los turistas.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5, color: '#FFB86B', marginTop: 10 }}>Vender en Burrito →</div>
      </div>
      <span style={{ fontSize: 44 }}>🧑‍🎨</span>
    </motion.button>
  )
}

export function StatusPill({ status }: { status: ProductStatus }) {
  const color = status === 'published' ? '#2E9E5B' : status === 'pending_review' ? '#B7791F' : status === 'rejected' ? '#D14B3A' : 'var(--muted)'
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 13%, transparent)`, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Video ─────────────────────────────────────────────────────────────────────

/** Video en bucle, silenciado al empezar, con botón de sonido. */
export function LoopingVideo({ src, style }: { src: string; style?: React.CSSProperties }) {
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  return (
    <div style={{ position: 'relative', background: '#000', overflow: 'hidden', ...style }}>
      <video
        src={src} autoPlay loop muted={muted} playsInline onCanPlay={() => setReady(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity .3s' }}
      />
      {!ready && <div className="mk-spinner" style={{ position: 'absolute', top: '50%', left: '50%', width: 26, height: 26, margin: -13 }} />}
      <button
        onClick={e => { e.stopPropagation(); setMuted(m => !m) }}
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
        style={{ position: 'absolute', right: 10, bottom: 10, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {muted ? <VolumeX size={17} color="white" /> : <Volume2 size={17} color="white" />}
      </button>
    </div>
  )
}

// ── Ficha ─────────────────────────────────────────────────────────────────────

type Slide = { kind: 'photo'; url: string } | { kind: 'video'; url: string; ai: boolean }

export function MarketProductModal({ p, onClose }: { p: MarketProduct; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const [page, setPage] = useState(0)
  const pager = useRef<HTMLDivElement>(null)
  const c = cover(p)
  const cat = categoryOf(p.category)
  // Primero la portada, luego el video de la IA, los videos del vendedor y el resto de fotos.
  const slides: Slide[] = [
    ...(c ? [{ kind: 'photo' as const, url: mediaUrl(c.path) }] : []),
    ...(p.ai_video_path ? [{ kind: 'video' as const, url: mediaUrl(p.ai_video_path), ai: true }] : []),
    ...p.media.filter(m => m.type === 'video').map(m => ({ kind: 'video' as const, url: mediaUrl(m.path), ai: false })),
    ...p.media.filter(m => m.type === 'image' && m.path !== c?.path).map(m => ({ kind: 'photo' as const, url: mediaUrl(m.path) })),
  ]
  const maxQty = Math.min(20, Math.max(1, p.stock ?? 20))
  const price = p.price_pen

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onScroll = () => {
    const el = pager.current
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  const order = () => {
    const s = p.seller
    if (!s) return
    const line = price != null ? `• ${qty} × ${displayTitle(p)} — ${formatPrice(price * qty)}` : `• ${displayTitle(p)}`
    const msg = `Hola ${s.business_name} 👋 Te encontré en la Tienda de Burrito y quiero pedir:\n\n${line}\n\n¿Cómo coordinamos el pago y la entrega?${SIGNATURE}`
    window.open(`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(5,4,3,0.7)', backdropFilter: 'blur(6px)' }} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
      >
        <div onClick={e => e.stopPropagation()} style={{
          pointerEvents: 'auto', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: 'var(--card)',
          borderRadius: '28px 28px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 12px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hover)' }} />
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: 14, right: 14, zIndex: 3, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={17} color="white" />
          </button>

          {/* Galería deslizable con puntitos */}
          <div style={{ position: 'relative', margin: '0 16px', aspectRatio: '0.85', borderRadius: 24, overflow: 'hidden', background: 'var(--card2)' }}>
            <div ref={pager} onScroll={onScroll} style={{ display: 'flex', width: '100%', height: '100%', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {slides.map((s, i) => (
                <div key={i} style={{ flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                  {s.kind === 'photo' ? (
                    <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      {page === i && <LoopingVideo src={s.url} style={{ width: '100%', height: '100%' }} />}
                      {s.ai && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: 'white', background: 'rgba(0,0,0,0.45)', padding: '4px 9px', borderRadius: 99, fontFamily: 'var(--font-body)' }}>
                          ✨ Video IA
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, padding: '5px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.3)' }}>
                {slides.map((_, i) => (
                  <span key={i} style={{ height: 6, width: page === i ? 16 : 6, borderRadius: 99, background: `rgba(255,255,255,${page === i ? 1 : 0.55})`, transition: 'width .25s' }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '16px 20px 0' }}>
            {cat && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{cat.emoji} {cat.label}</div>}
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.4px', lineHeight: '28px', color: 'var(--white)', margin: '4px 0 0' }}>{displayTitle(p)}</h3>
            {p.tagline && <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--orange)', margin: '4px 0 0' }}>{p.tagline}</p>}

            {p.seller && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: 12, borderRadius: 16, background: 'var(--card2)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: HERO_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 17 }}>
                  {p.seller.business_name[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <SellerLine s={p.seller} color="var(--white)" />
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
                    {[p.seller.craft, p.seller.district && `${p.seller.district}, Piura`].filter(Boolean).join(' · ') || 'Hecho en Piura'}
                  </div>
                </div>
              </div>
            )}

            {p.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: '21px', color: 'var(--white)', opacity: 0.85, marginTop: 14, whiteSpace: 'pre-line' }}>{p.description}</p>}

            {p.materials.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {p.materials.map(m => (
                  <span key={m} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--white)', background: 'var(--card2)', padding: '5px 10px', borderRadius: 99 }}>{m}</span>
                ))}
              </div>
            )}

            {p.story && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 18, background: 'color-mix(in srgb, var(--orange) 8%, transparent)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--orange)' }}>La historia detrás</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: '19px', color: 'var(--white)', margin: '4px 0 0' }}>{p.story}</p>
              </div>
            )}

            {price != null && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 18 }}>
                <QtyButton icon={<Minus size={17} />} disabled={qty <= 1} onClick={() => setQty(q => q - 1)} label="Menos" />
                <span style={{ width: 44, textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, color: 'var(--white)' }}>{qty}</span>
                <QtyButton icon={<Plus size={17} />} disabled={qty >= maxQty} onClick={() => setQty(q => q + 1)} label="Más" />
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>Total</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, color: 'var(--orange)' }}>{formatPrice(price * qty)}</div>
                </div>
              </div>
            )}

            {p.seller && (
              <>
                <button onClick={order} style={{
                  width: '100%', height: 54, marginTop: 18, border: 'none', borderRadius: 16, background: '#1FA855', color: 'white',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>
                  Pedir por WhatsApp
                </button>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
                  Coordinas el pago y la entrega directo con {p.seller.business_name}. Burrito no cobra ni procesa pagos.
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function QtyButton({ icon, disabled, onClick, label }: { icon: React.ReactNode; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button whileTap={{ scale: 0.86 }} onClick={onClick} disabled={disabled} aria-label={label} style={{
      width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--muted)' : 'var(--orange)', opacity: disabled ? 0.4 : 1, boxShadow: 'var(--shadow-card)',
    }}>
      {icon}
    </motion.button>
  )
}
