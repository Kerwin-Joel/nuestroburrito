import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { Spot } from '../../types/spot'
import TiktokVideoCard from './TiktokVideoCard'

interface Props {
  spot: Spot
}

export default function SpotTiktokSection({ spot }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const cards = scrollRef.current.querySelectorAll('.tiktok-card')
      gsap.fromTo(cards,
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.2
        }
      )
    }
  }, [spot.id])

  if (!spot.tiktokUrls || spot.tiktokUrls.length === 0) {
    return (
      <div style={{ marginTop: '24px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--orange)', letterSpacing: '1px', marginBottom: '8px' }}>
          EN TIKTOK
        </p>
        <div style={{
          height: '200px',
          border: '2px dashed var(--dim)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
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
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--orange)', letterSpacing: '1px', marginBottom: '4px' }}>
          EN TIKTOK
        </p>
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--white)', fontWeight: 600 }}>
          Lo que dicen de {spot.name}
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '24px',
          margin: '0 -20px',
          padding: '0 20px 20px',
        }}
      >
        {spot.tiktokUrls.map((url, i) => (
          <div key={`${spot.id}-tiktok-${i}`} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
            <TiktokVideoCard url={url} />
          </div>
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
