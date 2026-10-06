import { useEffect, useRef } from 'react'

/**
 * Apertura de la app — espejo de ui/splash/SplashScreen.kt en la app nativa.
 * Tres variantes (algarrobo, sol, olas), una al azar por arranque, con la
 * misma coreografía: primero el motivo piurano de fondo, luego el isotipo,
 * luego el nombre escribiéndose de izquierda a derecha, luego el tagline.
 * Reemplaza el loader genérico que había antes (un spinner sin identidad).
 */

const ORANGE = '#E8920A'
const HOT = '#D4780A'
const AMBER = '#B85C00'
const BG = '#FDF8EF'
const MUTED = '#A08060'

const TIMELINE_MS = 1150
const HOLD_MS = 180
const EXIT_MS = 170
/** Tope duro esperando `waitFor` (p. ej. la sesión no termina de confirmarse) — pasado esto, se entra igual. */
const MAX_EXTRA_WAIT_MS = 4000

type Style = 'algarrobo' | 'sol' | 'olas'
const STYLES: Style[] = ['algarrobo', 'sol', 'olas']

/** Mismo cubic-bezier(0.16, 1, 0.3, 1) que usa la app nativa: entra rápido, frena largo. */
function cubicBezierEasing(x1: number, y1: number, x2: number, y2: number) {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1
  const C = (a1: number) => 3 * a1
  const calc = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
  const slope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = calc(t, x1, x2) - x
      const d = slope(t, x1, x2)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    return calc(t, y1, y2)
  }
}
const ease = cubicBezierEasing(0.16, 1, 0.3, 1)

function phase(t: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (t - from) / (to - from)))
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ─── Fondos ─── */

function drawAlgarrobo(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, timeSec: number) {
  const cx = w / 2
  const ground = h * 0.80
  const trunkH = h * 0.24
  const sway = Math.sin(timeSec * (2 * Math.PI / 4.2)) // periodo 4.2s
  const ink = rgba(AMBER, 0.55)

  // Tronco
  const trunkP = ease(phase(progress, 0, 0.42))
  if (trunkP > 0) {
    const p0 = { x: cx - 3, y: ground }
    const c1 = { x: cx - 10, y: ground - trunkH * 0.38 }
    const c2 = { x: cx + 8, y: ground - trunkH * 0.66 }
    const p1 = { x: cx + 1, y: ground - trunkH }
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.min(w, h) * 0.022
    ctx.lineCap = 'round'
    ctx.beginPath()
    const steps = 40
    for (let i = 0; i <= steps * trunkP; i++) {
      const t = i / steps
      const x = (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * c1.x + 3 * (1 - t) * t * t * c2.x + t ** 3 * p1.x
      const y = (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * c1.y + 3 * (1 - t) * t * t * c2.y + t ** 3 * p1.y
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Ramas
  const branches = [
    { startAt: 0.52, angle: -152, length: 0.30, delay: 0.30 },
    { startAt: 0.62, angle: -28, length: 0.34, delay: 0.36 },
    { startAt: 0.74, angle: -118, length: 0.26, delay: 0.44 },
    { startAt: 0.80, angle: -58, length: 0.28, delay: 0.50 },
    { startAt: 0.90, angle: -95, length: 0.20, delay: 0.58 },
  ]
  branches.forEach(b => {
    const p = ease(phase(progress, b.delay, b.delay + 0.34))
    if (p <= 0) return
    const originY = ground - trunkH * b.startAt
    const len = Math.min(w, h) * b.length
    const rad = ((b.angle + sway * 1.6) * Math.PI) / 180
    const endX = cx + Math.cos(rad) * len
    const endY = originY + Math.sin(rad) * len
    const ctrl = { x: (cx + endX) / 2, y: originY - len * 0.30 }
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.min(w, h) * 0.010
    ctx.beginPath()
    const steps = 24
    for (let i = 0; i <= steps * p; i++) {
      const t = i / steps
      const x = (1 - t) ** 2 * cx + 2 * (1 - t) * t * ctrl.x + t ** 2 * endX
      const y = (1 - t) ** 2 * originY + 2 * (1 - t) * t * ctrl.y + t ** 2 * endY
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  })

  // Copa
  const top = ground - trunkH * 1.12
  const blobs: [number, number, number][] = [
    [-0.20, 0.02, 0.30], [0.16, -0.02, 0.27], [-0.02, -0.07, 0.24], [-0.34, 0.06, 0.18], [0.34, 0.05, 0.19],
  ]
  blobs.forEach(([dx, dy, r], index) => {
    const bp = ease(phase(progress, 0.52 + index * 0.045, 0.52 + index * 0.045 + 0.30))
    if (bp <= 0) return
    const radius = Math.min(w, h) * r * bp
    ctx.fillStyle = rgba(ORANGE, 0.16)
    ctx.beginPath()
    ctx.arc(cx + w * dx + sway * 4, top + h * dy, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  // Suelo
  const groundP = phase(progress, 0.30, 0.80)
  if (groundP > 0) {
    ctx.strokeStyle = rgba(AMBER, 0.22 * groundP)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - w * 0.42 * groundP, ground)
    ctx.lineTo(cx + w * 0.42 * groundP, ground)
    ctx.stroke()
  }
}

function drawSol(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, timeSec: number) {
  const p = ease(progress)
  const cx = w / 2
  const cy = h / 2 - h * 0.055
  const shimmer = 0.97 + 0.03 * (0.5 + 0.5 * Math.sin(timeSec * (2 * Math.PI / 2.6)))
  const inner = Math.min(w, h) * 0.19 * shimmer
  const angle = (timeSec * (360 / 44)) % 360
  const counter = (-timeSec * (360 / 72)) % 360

  // Anillo de fondo — se salta si todavía es invisible, para no gastar
  // fotogramas dibujando algo con alpha casi cero al principio de la apertura.
  // 8 rayos (antes 12): en celulares más modestos, sumados a los 16 rayos
  // principales y el núcleo, los fills de más se notaban como tirones.
  if (p > 0.02) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((counter * Math.PI) / 180)
    for (let i = 0; i < 8; i++) {
      ctx.save()
      ctx.rotate((i * 45 * Math.PI) / 180)
      taperedRay(ctx, inner * 1.9, inner * (2.5 + 0.5 * p), 4.5, rgba(ORANGE, 0.09 * p))
      ctx.restore()
    }
    ctx.restore()
  }

  // Rayos principales
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((angle * Math.PI) / 180)
  for (let i = 0; i < 16; i++) {
    const long = i % 2 === 0
    const reach = long ? 0.34 : 0.25
    const rp = ease(phase(progress, i * 0.012, i * 0.012 + 0.5))
    if (rp <= 0) continue
    ctx.save()
    ctx.rotate((i * 22.5 * Math.PI) / 180)
    taperedRay(ctx, inner * 1.22, Math.min(w, h) * reach * rp, long ? 7 : 5, rgba(ORANGE, (long ? 0.30 : 0.20) * p))
    ctx.restore()
  }
  ctx.restore()

  // Núcleo
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner * 2.6)
  grad.addColorStop(0, rgba(AMBER, 0.40 * p))
  grad.addColorStop(0.5, rgba(HOT, 0.20 * p))
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, inner * 2.6, 0, Math.PI * 2)
  ctx.fill()
}

function taperedRay(ctx: CanvasRenderingContext2D, from: number, to: number, halfWidth: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-halfWidth, -from)
  ctx.lineTo(halfWidth, -from)
  ctx.lineTo(halfWidth * 0.25, -to)
  ctx.lineTo(-halfWidth * 0.25, -to)
  ctx.closePath()
  ctx.fill()
}

const WAVE_LAYERS = [
  { depth: 0.26, amplitude: 30, speed: 1.00, alpha: 0.18, foam: 0.16 },
  { depth: 0.19, amplitude: 22, speed: 1.45, alpha: 0.24, foam: 0.22 },
  { depth: 0.12, amplitude: 15, speed: 2.05, alpha: 0.32, foam: 0.32 },
]

function drawOlas(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, timeSec: number) {
  const p = ease(progress)
  const t = (timeSec * (2 * Math.PI / 6.4)) % (2 * Math.PI)

  WAVE_LAYERS.forEach((layer, index) => {
    const lp = ease(phase(progress, index * 0.10, index * 0.10 + 0.65))
    if (lp <= 0) return
    const baseY = h * (1.04 - layer.depth * lp)
    const phaseShift = t * layer.speed + index * 1.7

    // Cada 14px alcanza sobrado para que la curva se vea lisa y son bastantes
    // menos senos que calcular por cuadro (x3 capas) que a cada 6-10px.
    const points: [number, number][] = []
    for (let x = 0; x <= w; x += 14) {
      const y = baseY +
        Math.sin((x / w) * 3.4 * Math.PI + phaseShift) * layer.amplitude +
        Math.sin((x / w) * 7.1 * Math.PI + phaseShift * 0.7) * layer.amplitude * 0.33
      points.push([x, y])
    }

    ctx.fillStyle = rgba(ORANGE, layer.alpha * p)
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    points.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = `rgba(255,255,255,${layer.foam * p})`
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
    ctx.stroke()
  })
}

/**
 * `waitFor`: si sigue en `true` cuando termina la coreografía de entrada
 * (p. ej. todavía se está confirmando la sesión), la escena se queda quieta
 * y con vida (el sol sigue girando, el mar sigue moviéndose) en vez de
 * cortar a una pantalla en blanco — recién cuando pasa a `false` se
 * desvanece y se llama a `onDone`.
 */
export default function AppSplash({ onDone, waitFor = false }: { onDone: () => void; waitFor?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<Style>(STYLES[Math.floor(Math.random() * STYLES.length)])
  const doneRef = useRef(false)
  const waitForRef = useRef(waitFor)
  useEffect(() => { waitForRef.current = waitFor }, [waitFor])
  // ProtectedRoute pasa `onDone={() => setSplashDone(true)}` — una función
  // nueva en cada render suyo (cada vez que useAuthStore cambia mientras
  // isLoading sigue true). Si el useEffect de abajo dependiera de `onDone`
  // directo, cada una de esas renovaciones reiniciaba desde cero el timeline
  // entero (cancelaba el rAF y volvía a poner `start = performance.now()`):
  // eso era el "se reproduce a la mitad, parpadea y vuelve a arrancar" que
  // se vio recién en producción. Con la ref, el efecto principal corre una
  // sola vez al montar y siempre llama a la versión más nueva de onDone.
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    // Las formas de fondo son borrones suaves, no detalle fino — no hace
    // falta nitidez retina para que se vean bien, y en celulares con dpr
    // 2.5–3.5 redibujar a 1.5 seguía siendo bastante canvas 60 veces por
    // segundo. Con dpr=1 se ve prácticamente igual y deja de tirar cuadros.
    const dpr = Math.min(devicePixelRatio || 1, 1)

    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf: number
    let exitStart: number | null = null

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      onDoneRef.current()
    }

    const loop = (now: number) => {
      const elapsed = now - start

      // Red de seguridad: si algo se cuelga (una sesión que nunca termina de
      // confirmarse, un error silencioso) esto nunca debe tapar la app para
      // siempre. Pasado este límite se entra sí o sí, se vea o no la apertura.
      if (elapsed >= TIMELINE_MS + HOLD_MS + MAX_EXTRA_WAIT_MS) {
        finish()
        return
      }

      try {
        const timeSec = elapsed / 1000
        const w = innerWidth, h = innerHeight
        const introDone = elapsed >= TIMELINE_MS + HOLD_MS

        ctx.clearRect(0, 0, w, h)

        const t = Math.min(1, elapsed / TIMELINE_MS)
        const scene = phase(t, 0.00, 0.62)
        const mark = phase(t, 0.26, 0.72)
        const word = phase(t, 0.46, 0.88)
        const tag = phase(t, 0.68, 1.00)

        if (styleRef.current === 'algarrobo') drawAlgarrobo(ctx, w, h, scene, timeSec)
        else if (styleRef.current === 'sol') drawSol(ctx, w, h, scene, timeSec)
        else drawOlas(ctx, w, h, scene, timeSec)

        if (iconRef.current) {
          const e = ease(mark)
          iconRef.current.style.opacity = String(e)
          iconRef.current.style.transform = `scale(${0.84 + 0.16 * e}) translateY(${(1 - e) * 24}px)`
        }
        if (wordRef.current) {
          const e = ease(word)
          wordRef.current.style.opacity = word > 0 ? '1' : '0'
          wordRef.current.style.clipPath = `inset(0 ${(1 - e) * 100}% 0 0)`
        }
        if (tagRef.current) {
          const e = ease(tag)
          tagRef.current.style.opacity = String(e)
          tagRef.current.style.transform = `translateY(${(1 - e) * 10}px)`
        }

        if (!introDone || waitForRef.current) {
          raf = requestAnimationFrame(loop)
          return
        }

        // La entrada ya terminó y ya no hace falta esperar nada más: se desvanece.
        if (exitStart === null) exitStart = now
        const exitP = Math.max(0, 1 - (now - exitStart) / EXIT_MS)
        if (rootRef.current) rootRef.current.style.opacity = String(exitP)
        if (exitP <= 0) { finish(); return }
        raf = requestAnimationFrame(loop)
      } catch (err) {
        // Que un dibujo falle no debe dejar a nadie mirando una pantalla
        // trabada: se entra directo a la app.
        console.error('AppSplash: fallo dibujando la apertura, se salta.', err)
        finish()
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
    // Deliberadamente sin `onDone`: esta animación se arma una sola vez por
    // arranque, mediante onDoneRef (ver arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={rootRef}
      onClick={() => { if (!doneRef.current) { doneRef.current = true; onDoneRef.current() } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          ref={iconRef}
          style={{
            opacity: 0, width: '112px', height: '112px', borderRadius: '50%',
            overflow: 'hidden', border: `1.5px solid ${rgba(AMBER, 0.18)}`,
            boxShadow: '0 8px 24px rgba(184,92,0,0.18)',
          }}
        >
          {/* Mismo isotipo que usa la app nativa (R.drawable.isotipo_burrito),
              copiado 1:1 — no una versión distinta armada para la web. */}
          <img src="/isotipo_burrito.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ height: '18px' }} />
        <div ref={wordRef} style={{ opacity: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', color: '#1a1208', letterSpacing: '-1px' }}>
            burri<span style={{ color: ORANGE }}>to</span>
          </span>
        </div>
        <div style={{ height: '14px' }} />
        <div ref={tagRef} style={{ opacity: 0 }}>
          {/* Con las ramas/rayos/olas más marcados (se habían quedado muy
              tenues), el tagline se mezclaba con el fondo en esta misma zona
              — este halo lo despega sin importar qué variante haya tocado. */}
          <span
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: MUTED,
              textShadow: `0 0 10px ${BG}, 0 0 10px ${BG}, 0 1px 2px ${BG}`,
            }}
          >
            PIURA · PERÚ
          </span>
        </div>
      </div>
    </div>
  )
}
