import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import {
  X, Star, Plus, ExternalLink, ChevronUp, Lightbulb,
  Globe, MessageCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useUIStore } from '../../stores/useUIStore'
import { CATEGORY_LABELS } from '../../lib/constants'
import SpotTiktokSection from '../shared/SpotTiktokSection'
import type { ItineraryStop } from '../../types/itinerary'
import type { SpotSocialLinks } from '../../types/spot'

const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
)

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

/* ─── Photo Carousel ─── */
function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0)

  if (!photos.length) return null

  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length)
  const next = () => setIdx(i => (i + 1) % photos.length)

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Image strip */}
      <div style={{
        display: 'flex',
        transform: `translateX(-${idx * 100}%)`,
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${name} — foto ${i + 1}`}
            style={{ width: '100%', height: '220px', objectFit: 'cover', flexShrink: 0 }}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,16,9,0.75) 0%, transparent 55%)', pointerEvents: 'none' }} />

      {/* Arrows — only if more than 1 photo */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Foto anterior"
            style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(8,7,5,0.65)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            aria-label="Foto siguiente"
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(8,7,5,0.65)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Dot indicators */}
          <div style={{
            position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '5px',
          }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? '18px' : '6px', height: '6px',
                  borderRadius: '99px',
                  background: i === idx ? 'var(--orange)' : 'rgba(255,255,255,0.45)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: '12px', right: '52px',
            background: 'rgba(8,7,5,0.65)', borderRadius: '99px',
            padding: '3px 10px',
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff',
          }}>
            {idx + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Social Links ─── */
const SOCIAL_CONFIG: { key: keyof SpotSocialLinks; Icon: any; label: string; color: string; prefix: string }[] = [
  { key: 'instagram', Icon: InstagramIcon, label: 'Instagram', color: '#E1306C', prefix: 'https://instagram.com/' },
  {
    key: 'tiktok', Icon: () => (           // TikTok icon via SVG
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z" />
      </svg>
    ), label: 'TikTok', color: '#010101', prefix: 'https://tiktok.com/@'
  },
  { key: 'facebook', Icon: FacebookIcon, label: 'Facebook', color: '#1877F2', prefix: 'https://facebook.com/' },
  { key: 'whatsapp', Icon: MessageCircle, label: 'WhatsApp', color: '#25D366', prefix: 'https://wa.me/' },
  { key: 'website', Icon: Globe, label: 'Sitio web', color: 'var(--orange)', prefix: '' },
]

function buildHref(val: string, prefix: string, key: string): string {
  if (val.startsWith('http://') || val.startsWith('https://')) return val
  if (key === 'whatsapp') return `https://wa.me/${val.replace(/\D/g, '')}`
  if (val.includes('.com/') || val.includes('.pe/') || val.includes('.net/')) return `https://${val}`
  return prefix + val.replace('@', '')
}

function SocialLinksSection({ links }: { links: SpotSocialLinks }) {
  const active = SOCIAL_CONFIG.filter(s => !!(links as any)[s.key])
  if (!active.length) return null

  return (
    <div style={{ marginBottom: '16px' }}>
      <p className="section-label" style={{ marginBottom: '10px' }}>REDES Y CONTACTO</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {active.map(({ key, Icon, label, color, prefix }) => {
          const val = (links as any)[key] as string
          const href = buildHref(val, prefix, key)
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '99px',
                background: 'var(--card2)',
                border: '1px solid var(--border)',
                color: color,
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                WebkitTapHighlightColor: 'transparent',  // ← móvil
                touchAction: 'manipulation',
              }}
            >
              <Icon size={14} />
              {label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function SpotBottomSheet() {
  const { selectedSpot, sheetOpen, sheetExpanded, setSheetOpen, setSheetExpanded, selectSpot } = useSpotsStore()
  const { addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sheetRef.current) return
    if (sheetOpen) {
      gsap.fromTo(sheetRef.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' })
    } else {
      gsap.to(sheetRef.current, { y: '100%', duration: 0.3, ease: 'power2.in' })
    }
  }, [sheetOpen])

  const close = () => {
    setSheetOpen(false)
    setTimeout(() => selectSpot(null), 300)
  }

  const handleAddToItinerary = () => {
    if (!selectedSpot) return
    const stop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      spotId: selectedSpot.id,
      spotName: selectedSpot.name,
      time: '12:00',
      description: selectedSpot.description,
      localTip: selectedSpot.localTip,
      travelToNext: '',
      photoUrl: selectedSpot.photoUrl,
      lat: selectedSpot.lat,
      lng: selectedSpot.lng,
      visited: false,
    }
    addStop(stop)
    addToast({ type: 'success', message: `${selectedSpot.name} añadido a tu día` })
    close()
  }

  if (!selectedSpot) return null

  const cat = CATEGORY_LABELS[selectedSpot.category]
  const mapsUrl = `https://maps.google.com/?q=${selectedSpot.lat},${selectedSpot.lng}`

  // Build photos array: prefer photos[] from DB, fall back to photoUrl
  const photos: string[] = (() => {
    const raw = selectedSpot.photos ?? []
    // If we have the array, use it (it already includes the main photo)
    if (raw.length > 0) return raw.filter(Boolean)
    // Fall back to single photoUrl
    return selectedSpot.photoUrl ? [selectedSpot.photoUrl] : []
  })()

  return (
    <>
      {/* Backdrop */}
      {sheetOpen && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(5,4,3,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 4001,
          background: 'var(--card)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          transform: 'translateY(100%)',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', background: 'var(--dim)', borderRadius: '2px' }} />
        </div>

        {/* Photo carousel */}
        <div style={{ position: 'relative' }}>
          <PhotoCarousel photos={photos} name={selectedSpot.name} />

          {/* Category badge */}
          <span className="badge badge-orange" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
            {cat?.emoji} {cat?.label}
          </span>

          {/* Close button */}
          <button
            onClick={close}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 2,
              background: 'rgba(8,7,5,0.7)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--white)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>

          {/* Name */}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800,
            letterSpacing: '-1px', color: 'var(--white)', marginBottom: '8px',
          }}>
            {selectedSpot.name}
          </h2>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} color="var(--yellow)" fill={i < Math.round(selectedSpot.rating) ? 'var(--yellow)' : 'transparent'} />
            ))}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--yellow)', fontWeight: 700 }}>{selectedSpot.rating}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray)' }}>({selectedSpot.reviewCount} reseñas)</span>
          </div>

          {/* Local tip */}
          <div style={{
            display: 'flex', gap: '10px',
            background: 'rgba(255,170,59,0.08)',
            border: '1px solid rgba(255,170,59,0.2)',
            borderRadius: '10px', padding: '12px', marginBottom: '16px',
          }}>
            <Lightbulb size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--amber)', lineHeight: 1.5 }}>
              {selectedSpot.localTip}
            </p>
          </div>
          {/* Fecha del evento */}
          {selectedSpot.eventDate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.2)',
              borderRadius: '12px', padding: '10px 14px', marginBottom: '16px',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>📅</span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                  color: 'var(--orange)', letterSpacing: '1.5px',
                  textTransform: 'uppercase', marginBottom: '2px',
                }}>
                  {selectedSpot.eventDateEnd ? 'Fechas del evento' : 'Fecha del evento'}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>
                  {selectedSpot.eventDateEnd
                    ? `${new Date(selectedSpot.eventDate + 'T00:00:00').toLocaleDateString('es-PE', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })} hasta ${new Date(selectedSpot.eventDateEnd + 'T00:00:00').toLocaleDateString('es-PE', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}`
                    : new Date(selectedSpot.eventDate + 'T00:00:00').toLocaleDateString('es-PE', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })
                  }
                </div>
              </div>
            </div>
          )}

          {/* Expanded info */}
          {sheetExpanded && (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '16px' }}>
                {selectedSpot.description}
              </p>

              {/* Schedule */}
              {Object.keys(selectedSpot.schedule ?? {}).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p className="section-label" style={{ marginBottom: '10px' }}>HORARIOS</p>
                  {Object.entries(selectedSpot.schedule).map(([day, hours]) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>{day}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--white)', fontWeight: 500 }}>{hours}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Social links — always visible when available */}
          {selectedSpot.socialLinks && Object.values(selectedSpot.socialLinks).some(Boolean) && (
            <SocialLinksSection links={selectedSpot.socialLinks} />
          )}

          {/* Toggle expand */}
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginBottom: '12px', justifyContent: 'center', gap: '6px' }}
          >
            <ChevronUp size={14} style={{ transform: sheetExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {sheetExpanded ? 'Ver menos' : 'Ver detalles completos'}
          </button>

          {/* TikTok Section */}
          <SpotTiktokSection spot={selectedSpot} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {sheetExpanded && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <ExternalLink size={14} /> Cómo llegar
              </a>
            )}
            <button
              onClick={handleAddToItinerary}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Plus size={14} /> Añadir a mi itinerario
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
