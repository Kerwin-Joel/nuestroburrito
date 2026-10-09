import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { animate } from 'framer-motion'
import { useFlyToBarStore } from '../../stores/useFlyToBarStore'

// Espejo exacto de los parámetros en FlyToBar.kt.
const FLIGHT_MS = 720
const FLIGHT_EASE = [0.2, 0, 0, 1] as const
const COMMIT_AT = 0.85
const ARC_HEIGHT = 150 // px — altura del punto de control sobre el trayecto
const HALF = 26 // px — mitad del círculo de 52px

interface Point { x: number; y: number }

function place(t: number, ghostAlpha: number, start: Point, end: Point) {
  const control = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - ARC_HEIGHT }
  const u = 1 - t
  const x = start.x * u * u + control.x * 2 * u * t + end.x * t * t
  const y = start.y * u * u + control.y * 2 * u * t + end.y * t * t
  const arc = Math.sin(Math.PI * t)
  const landing = Math.min(Math.max((t - COMMIT_AT) / (1 - COMMIT_AT), 0), 1)
  const scale = (1 + 0.26 * arc) * (1 - 0.55 * landing)
  const rotation = -12 * arc
  const appear = Math.min(t / 0.08, 1)
  const alpha = appear * (1 - landing) * ghostAlpha
  return { left: x - HALF, top: y - HALF, scale, rotation, alpha }
}

function rectCenter(r: DOMRect): Point {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/**
 * Monta a nivel de TouristLayout, junto a CustomTabActionModals — el ícono
 * elegido en "Tu menú" vuela hasta la barra flotante, igual que
 * FlyToBarOverlay en FlyToBar.kt.
 */
export default function FlyToBarOverlay() {
  const flight = useFlyToBarStore(s => s.flight)
  const slotBounds = useFlyToBarStore(s => s.slotBounds)
  const commit = useFlyToBarStore(s => s.commit)
  const finish = useFlyToBarStore(s => s.finish)

  const mainRef = useRef<HTMLDivElement>(null)
  const ghost1Ref = useRef<HTMLDivElement>(null)
  const ghost2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!flight || !slotBounds) {
      if (flight && !slotBounds) {
        // La barra no está visible: aplica la elección sin animación.
        finish()
      }
      return
    }

    const start = rectCenter(flight.from)
    const end = rectCenter(slotBounds)
    let committed = false

    const controls = animate(0, 1, {
      duration: FLIGHT_MS / 1000,
      ease: FLIGHT_EASE,
      onUpdate: (t) => {
        if (t >= COMMIT_AT && !committed) { committed = true; commit() }

        const apply = (el: HTMLDivElement | null, tt: number, ghostAlpha: number) => {
          if (!el) return
          const p = place(Math.max(tt, 0), ghostAlpha, start, end)
          el.style.transform = `translate(${p.left}px, ${p.top}px) scale(${p.scale}) rotate(${p.rotation}deg)`
          el.style.opacity = String(p.alpha)
        }
        apply(mainRef.current, t, 1)
        apply(ghost1Ref.current, t - 0.09, 0.18)
        apply(ghost2Ref.current, t - 0.045, 0.34)
      },
      onComplete: () => finish(),
    })

    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.id])

  if (!flight) return null
  const Icon = flight.icon

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1250, pointerEvents: 'none' }}>
      <div ref={ghost1Ref} style={{ position: 'fixed', left: 0, top: 0, width: '52px', height: '52px', borderRadius: '50%', background: 'var(--orange)', opacity: 0 }} />
      <div ref={ghost2Ref} style={{ position: 'fixed', left: 0, top: 0, width: '52px', height: '52px', borderRadius: '50%', background: 'var(--orange)', opacity: 0 }} />
      <div
        ref={mainRef}
        style={{
          position: 'fixed', left: 0, top: 0, width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(255,85,0,0.5)', opacity: 0,
        }}
      >
        <Icon size={26} color="#fff" strokeWidth={2.2} />
      </div>
    </div>,
    document.body,
  )
}
