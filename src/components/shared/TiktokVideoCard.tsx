import { useState, useMemo } from 'react'
import { Play, Loader2, AlertCircle } from 'lucide-react'
import { useTiktokEmbed } from '../../hooks/useTiktokEmbed'

interface Props {
  url: string
}

/**
 * Extracts the video ID from various TikTok URL patterns:
 */
function extractVideoId(url: string): string | null {
  if (!url) return null
  const standardMatch = url.match(/\/video\/(\d+)/)
  if (standardMatch) return standardMatch[1]
  const queryMatch = url.match(/(\d+)\?/)
  if (queryMatch) return queryMatch[1]
  return null
}

export default function TiktokVideoCard({ url }: Props) {
  const videoId = useMemo(() => extractVideoId(url), [url])
  const { data, loading, error } = useTiktokEmbed(url)
  const [isStarted, setIsStarted] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Constants for the 'virtual width' trick to force high-quality player
  const CARD_WIDTH = 260
  const VIRTUAL_WIDTH = 340
  const SCALE = CARD_WIDTH / VIRTUAL_WIDTH // ~0.76

  if (!videoId || error) {
    return (
      <div style={{
        width: `${CARD_WIDTH}px`, height: '460px',
        background: 'var(--card2)', borderRadius: '24px',
        border: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center',
      }}>
        <AlertCircle size={24} color="var(--gray)" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)', marginTop: '8px' }}>
          {error ? 'Contenido no disponible' : 'Link no válido'}
        </span>
      </div>
    )
  }

  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}?lang=es-ES`

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
      }}
    >
      {/* Thumbnail / Poster View */}
      {!isStarted && (
        <div
          onClick={() => setIsStarted(true)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {data?.thumbnail_url ? (
            <img
              src={data.thumbnail_url}
              alt={data.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--dim), #000)', opacity: 0.8 }} />
          )}

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
            zIndex: 2,
          }} />

          <div className="play-btn-circle" style={{
            width: '68px',
            height: '68px',
            background: 'var(--orange)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255,85,0,0.6)',
            zIndex: 3,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <Play size={32} color="white" fill="white" style={{ marginLeft: '4px' }} />
          </div>

          <p style={{
            marginTop: '20px',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--white)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            zIndex: 3,
          }}>
            {loading ? 'Cargando...' : 'Reproducir'}
          </p>

          {data?.author_name && (
            <span style={{
              position: 'absolute',
              bottom: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--white)',
              opacity: 0.8,
              zIndex: 3,
            }}>
              @{data.author_name}
            </span>
          )}
        </div>
      )}

      {/* High-Fidelity Iframe Player */}
      {isStarted && (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: '#000',
          overflow: 'hidden'
        }}>
          {!iframeLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              background: '#090807'
            }}>
              <Loader2 size={24} color="var(--orange)" className="animate-spin" />
            </div>
          )}

          <div style={{
            width: `${VIRTUAL_WIDTH}px`,
            height: '680px', // Large virtual height to allow deep clipping
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${SCALE})`,
            transformOrigin: 'center center',
          }}>
            <iframe
              src={embedUrl}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; clipboard-write"
              onLoad={() => setIframeLoaded(true)}
              allowFullScreen
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.6s ease',
                marginTop: '-80px',
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        .tiktok-card:hover .play-btn-circle {
          transform: scale(1.12);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
