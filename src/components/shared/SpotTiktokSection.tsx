import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Play, Loader2 } from 'lucide-react'
import type { Spot } from '../../types/spot'
import TiktokVideoCard from './TiktokVideoCard'

interface Props {
  spot: Spot
}

// Detecta la plataforma y retorna metadata
function detectPlatform(url: string): { platform: 'tiktok' | 'instagram' | 'facebook' | 'unknown'; embedUrl: string | null } {
  if (url.includes('tiktok.com')) {
    return { platform: 'tiktok', embedUrl: null }
  }

  if (url.includes('instagram.com')) {
    const clean = url.split('?')[0].replace(/\/$/, '')
    return {
      platform: 'instagram',
      embedUrl: `${clean}/embed/`,
    }
  }

  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return {
      platform: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=260`,
    }
  }

  return { platform: 'unknown', embedUrl: null }
}

const PLATFORM_LABELS = {
  tiktok: {
    label: 'TikTok',
    color: '#ffffff',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  unknown: {
    label: 'Video',
    color: 'var(--orange)',
    icon: <span style={{ fontSize: '12px' }}>▶</span>,
  },
}

/* ─── EmbedVideoCard — Instagram & Facebook ─── */
function EmbedVideoCard({ url, platform }: { url: string; platform: 'instagram' | 'facebook' | 'unknown' }) {
  const { embedUrl } = detectPlatform(url)
  const meta = PLATFORM_LABELS[platform] ?? PLATFORM_LABELS.unknown
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const CARD_WIDTH = 260

  return (
    <div
      className="tiktok-card"
      style={{
        width: `${CARD_WIDTH}px`,
        height: '460px',
        background: '#000',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        flexShrink: 0,
      }}
    >
      {/* Badge plataforma */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '5px',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        borderRadius: '20px', padding: '4px 10px',
        border: `1px solid ${meta.color}40`,
      }}>
        <span style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>{meta.icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          fontWeight: 700, color: meta.color, letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          {meta.label}
        </span>
      </div>

      {/* Loader */}
      {!iframeLoaded && embedUrl && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#090807', flexDirection: 'column', gap: '12px',
        }}>
          <Loader2 size={24} color="var(--orange)" className="animate-spin" />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--muted)', letterSpacing: '1px',
          }}>
            CARGANDO...
          </span>
        </div>
      )}

      {embedUrl ? (
        <iframe
          src={embedUrl}
          width={CARD_WIDTH}
          height={460}
          style={{
            border: 'none',
            display: 'block',
            opacity: iframeLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
        />
      ) : (
        /* Fallback — botón para abrir en la plataforma */
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', textDecoration: 'none',
            flexDirection: 'column', gap: '12px',
          }}
        >
          <div style={{
            width: '68px', height: '68px',
            background: meta.color,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${meta.color}60`,
          }}>
            <Play size={32} color="white" fill="white" style={{ marginLeft: '4px' }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '11px',
            fontWeight: 800, color: 'var(--white)',
            letterSpacing: '3px', textTransform: 'uppercase',
          }}>
            Ver en {meta.label}
          </span>
        </a>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

/* ─── Main Component ─── */
export default function SpotTiktokSection({ spot }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const urls = spot.tiktokUrls ?? []

  // Label dinámico según plataformas presentes
  const platforms = [...new Set(urls.map(url => detectPlatform(url).platform))]
  const headerLabel = platforms.length === 1
    ? PLATFORM_LABELS[platforms[0]]?.label ?? 'VIDEOS'
    : 'REDES'

  useEffect(() => {
    if (scrollRef.current) {
      const cards = scrollRef.current.querySelectorAll('.tiktok-card')
      gsap.fromTo(cards,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
      )
    }
  }, [spot.id])

  if (!urls.length) {
    return (
      <div style={{ marginTop: '24px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--orange)', letterSpacing: '1px', marginBottom: '8px',
        }}>
          EN REDES
        </p>
        <div style={{
          height: '200px', border: '2px dashed var(--dim)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '20px',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--gray)' }}>
            Aún no hay videos de este lugar 🎬<br />
            ¡Sé el primero en compartir!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '32px', marginBottom: '8px' }}>
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--orange)', letterSpacing: '1px', marginBottom: '4px',
        }}>
          EN {headerLabel.toUpperCase()}
        </p>
        <h3 style={{
          fontFamily: 'var(--font-body)', fontSize: '16px',
          color: 'var(--white)', fontWeight: 600,
        }}>
          Lo que dicen de {spot.name}
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          display: 'flex', gap: '16px', overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          margin: '0 -20px', padding: '0 20px 20px',
        }}
      >
        {urls.map((url, i) => {
          const { platform } = detectPlatform(url)

          if (platform === 'tiktok') {
            return (
              <div key={`${spot.id}-video-${i}`} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                <TiktokVideoCard url={url} />
              </div>
            )
          }

          return (
            <div key={`${spot.id}-video-${i}`} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              <EmbedVideoCard
                url={url}
                platform={platform === 'instagram' || platform === 'facebook' ? platform : 'unknown'}
              />
            </div>
          )
        })}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}