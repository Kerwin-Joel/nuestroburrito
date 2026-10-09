import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Espejo de BurritoCharacter.kt (nativo): ahí es un WebView que sirve
 * app/src/main/assets/burrito/ (index.html + burrito.js + three r183 local)
 * con una capa de gestos de Compose encima; acá es el mismo bundle —
 * copiado tal cual a public/burrito/ — en un iframe, con la misma capa de
 * gestos en React: arrastrar para girarlo, tocarlo para que reaccione, y
 * si lo tocan demasiado se queja con un globo.
 */
interface Props {
  /** B = Burrito Chevy (cría, chibi). C = Burrito (aventurero, con alforjas). */
  variant?: 'B' | 'C'
  /** Una acción ("sleep") o una secuencia ("wave,idle") — la última se repite. */
  action?: string
  /** Tocarlo lo hace reaccionar: cada toque, un comportamiento distinto. */
  reactive?: boolean
  /** Si lo tocan muchas veces seguidas, se queja con este globo. null = no se queja. */
  grumpyMessage?: string | null
  /** Arrastrar de lado para girarlo y verlo en 3D. */
  rotatable?: boolean
  className?: string
  style?: React.CSSProperties
}

const TAP_WINDOW_MS = 4500
const TAPS_TO_GRUMBLE = 5
const DRAG_THRESHOLD_PX = 6

export default function BurritoCharacter({
  variant = 'B',
  action = 'idle',
  reactive = true,
  grumpyMessage = 'Oe churre, ¡deja dormir! 😴',
  rotatable = true,
  className,
  style,
}: Props) {
  const src = `/burrito/index.html?v=${variant}&a=${encodeURIComponent(action)}`
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [grumbling, setGrumbling] = useState(false)
  const recentTaps = useRef<number[]>([])
  const drag = useRef<{ active: boolean; lastX: number; moved: number } | null>(null)

  useEffect(() => {
    // Espejo del @JavascriptInterface ready(): el fundido entra recién con
    // el primer cuadro pintado, no apenas carga el documento.
    setReady(false)
    const onMessage = (e: MessageEvent) => {
      if (e.source === iframeRef.current?.contentWindow && e.data?.type === 'burrito-ready') setReady(true)
    }
    window.addEventListener('message', onMessage)
    const fallback = setTimeout(() => setReady(true), 2500)
    return () => { window.removeEventListener('message', onMessage); clearTimeout(fallback) }
  }, [src])

  useEffect(() => {
    if (!grumbling) return
    const t = setTimeout(() => setGrumbling(false), 2800)
    return () => clearTimeout(t)
  }, [grumbling])

  interface BurritoAPI {
    play: (a: string) => void
    spin: (dx: number) => void
    release: () => void
    react: (a: string) => void
    reactNext: () => void
    grumble: () => void
  }
  const burrito = (): BurritoAPI | undefined => {
    try {
      return (iframeRef.current?.contentWindow as (Window & { burrito?: BurritoAPI }) | null | undefined)?.burrito
    } catch { return undefined }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!reactive && !rotatable) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drag.current = { active: true, lastX: e.clientX, moved: 0 }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current?.active || !rotatable) return
    e.preventDefault()
    const dx = e.clientX - drag.current.lastX
    drag.current.lastX = e.clientX
    drag.current.moved += Math.abs(dx)
    if (drag.current.moved > DRAG_THRESHOLD_PX) burrito()?.spin(dx)
  }

  const handlePointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return

    if (rotatable && d.moved > DRAG_THRESHOLD_PX) {
      burrito()?.release()
      return
    }

    // Fue un toque, no un arrastre — espejo de detectTapGestures en Kotlin.
    if (!reactive || grumbling) return
    const now = Date.now()
    recentTaps.current.push(now)
    recentTaps.current = recentTaps.current.filter(t => now - t <= TAP_WINDOW_MS)
    if (grumpyMessage && recentTaps.current.length >= TAPS_TO_GRUMBLE) {
      recentTaps.current = []
      setGrumbling(true)
      burrito()?.grumble()
    } else {
      burrito()?.reactNext()
    }
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <motion.iframe
        ref={iframeRef}
        key={src}
        src={src}
        title="Burrito"
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.42 }}
        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', pointerEvents: 'none' }}
        sandbox="allow-scripts allow-same-origin"
      />
      {(reactive || rotatable) && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'absolute', inset: 0, touchAction: rotatable ? 'pan-y' : 'auto', cursor: rotatable ? 'grab' : 'pointer',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}
        />
      )}
      {/* Envoltorio fijo (sin animar): centra el globo. Si el translateX de
          este centrado viviera en el motion.div de abajo, Framer Motion lo
          pisaría al animar scale/opacity — por eso van separados. */}
      <div style={{
        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
        width: 'min(190px, 88vw)', pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {grumbling && grumpyMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: 'bottom center' }}
            >
              <span style={{
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13.5px', color: 'var(--ink, #2a1a0f)',
                background: 'var(--card-light, #FFF8EC)', border: '1.5px solid var(--orange)', borderRadius: '16px',
                padding: '8px 12px', boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                width: '100%', boxSizing: 'border-box', textAlign: 'center',
              }}>
                {grumpyMessage}
              </span>
              <svg width="16" height="9" style={{ marginTop: '-1px' }}>
                <path d="M0,0 L16,0 L8,9 Z" fill="var(--card-light, #FFF8EC)" stroke="var(--orange)" strokeWidth="1.5" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
