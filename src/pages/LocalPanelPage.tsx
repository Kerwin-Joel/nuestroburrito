import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Maximize2, Minimize2, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './local-panel.css'

/**
 * Panel del local (nuestroburrito.com/local/<token>): lo abre el dueño o su
 * personal, sin cuenta, con el enlace que le da el equipo Burrito. Muestra el
 * PIN vigente y un QR con ese mismo PIN; los dos cambian apenas alguien los
 * usa (para marcar una visita o canjear un premio).
 *
 * Diseño: el local es el protagonista (su foto de fondo y su nombre en grande);
 * Burrito acompaña (logo arriba, en el centro del QR y al pie). "Modo
 * mostrador" lo deja a pantalla completa y sin que se apague la pantalla.
 */
interface Panel {
  spot_id: string
  spot_name: string
  photo_url: string | null
  pin: string
  qr_payload: string
  rotated_at: string
  validation: 'qr' | 'pin'
  enabled: boolean
  visits_required: number
  reward_title: string | null
  reward_emoji: string
  visits_today: number
  rewards_redeemed_today: number
}

type WakeLock = { release: () => Promise<void> }

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 + i * 0.08, type: 'spring' as const, stiffness: 260, damping: 26 },
})

export default function LocalPanelPage() {
  const { token = '' } = useParams()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [missing, setMissing] = useState(false)
  const [usedAt, setUsedAt] = useState(0)
  const [counter, setCounter] = useState(false)
  const lastPin = useRef<string | null>(null)
  const wake = useRef<WakeLock | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data, error } = await supabase.rpc('loyalty_owner_panel', { p_token: token })
      if (!alive) return
      if (error || !data) { setMissing(true); return }
      const p = data as Panel
      // El PIN cambió: alguien lo acaba de usar.
      if (lastPin.current && lastPin.current !== p.pin) setUsedAt(Date.now())
      lastPin.current = p.pin
      setMissing(false)
      setPanel(p)
    }
    load()
    const id = setInterval(load, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [token])

  useEffect(() => {
    if (!usedAt) return
    const t = setTimeout(() => setUsedAt(0), 3600)
    return () => clearTimeout(t)
  }, [usedAt])

  /** Modo mostrador: pantalla completa y la pantalla no se apaga. */
  const toggleCounter = async () => {
    const on = !counter
    setCounter(on)
    try {
      if (on) {
        await document.documentElement.requestFullscreen?.()
        const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLock> } }
        wake.current = (await nav.wakeLock?.request('screen')) ?? null
      } else {
        if (document.fullscreenElement) await document.exitFullscreen()
        await wake.current?.release()
        wake.current = null
      }
    } catch { /* el navegador puede no permitirlo: el panel igual funciona */ }
  }

  const qrUrl = panel ? `${window.location.origin}/app/verify?code=${encodeURIComponent(panel.qr_payload)}` : ''
  const used = usedAt > 0
  const name = panel?.spot_name.trim() ?? ''

  return (
    <div className="lp-root">
      {/* Fondo: la foto del local, desenfocada y con un zoom lento. */}
      {panel?.photo_url && (
        <div className="lp-ambient"><img src={panel.photo_url} alt="" /></div>
      )}
      <div className="lp-shade" />

      <div className="lp-content">
        {/* ── Barra: Burrito acompaña, discreto ── */}
        <motion.header {...stagger(0)} className="lp-topbar">
          <div className="lp-brand">
            <img src="/isotipo_burrito.png" alt="" />
            <span>burri<b>to</b></span>
            <em>para negocios</em>
          </div>
          {panel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="lp-live"><i /> En vivo</span>
              <button className="lp-icon-btn" onClick={toggleCounter} aria-label={counter ? 'Salir del modo mostrador' : 'Modo mostrador'}>
                {counter ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          )}
        </motion.header>

        {missing && (
          <motion.div {...stagger(1)} className="lp-card" style={{ textAlign: 'center', padding: 34 }}>
            <div style={{ fontSize: 44 }}>🔒</div>
            <h2 className="lp-h2" style={{ marginTop: 8 }}>Enlace no válido</h2>
            <p className="lp-muted">Pide un enlace nuevo al equipo de Burrito.</p>
          </motion.div>
        )}

        {panel && (
          <>
            {/* ── El local, protagonista ── */}
            <motion.section {...stagger(1)} className="lp-hero">
              {panel.photo_url ? <img src={panel.photo_url} alt="" /> : <div className="lp-hero-fallback"><Store size={40} /></div>}
              <div className="lp-hero-shade" />
              <div className="lp-hero-text">
                <h1>{name}</h1>
                {panel.enabled && panel.reward_title ? (
                  <span className="lp-reward-pill">
                    <span className="lp-reward-emoji">{panel.reward_emoji}</span>
                    {panel.reward_title} cada {panel.visits_required} visitas
                  </span>
                ) : (
                  <span className="lp-reward-pill">Visitas del pasaporte Burrito</span>
                )}
              </div>
            </motion.section>

            {/* ── PIN ── */}
            <motion.section {...stagger(2)} className={`lp-pin-card ${used ? 'used' : ''}`}>
              <div className="lp-pin-head">
                <span className="lp-eyebrow">PIN para tus clientes</span>
                <AnimatePresence>
                  {used && (
                    <motion.span className="lp-used" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
                      <Check size={14} strokeWidth={3} /> Usado · ya hay uno nuevo
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="lp-digits">
                {panel.pin.split('').map((d, i) => (
                  <div key={i} className="lp-digit-slot">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={`${d}-${panel.rotated_at}`} className="lp-digit"
                        initial={{ rotateX: -95, opacity: 0, y: -10 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} exit={{ rotateX: 95, opacity: 0, y: 10 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 320, damping: 22 }}>
                        {d}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              <p className="lp-pin-help">Díctalo al cliente o escríbelo en su celular. <b>Cambia apenas se usa.</b></p>
              {used && <span key={usedAt} className="lp-ripple" />}
            </motion.section>

            {/* ── QR con el mismo PIN, con el sello de Burrito al centro ── */}
            <motion.section {...stagger(3)} className="lp-ticket">
              <div className="lp-ticket-qr">
                <motion.div key={panel.qr_payload} initial={{ scale: 0.9, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <QRCodeSVG value={qrUrl} size={196} fgColor="#1A120A" bgColor="#ffffff" level="H"
                    imageSettings={{ src: '/isotipo_burrito.png', height: 46, width: 46, excavate: true }} />
                </motion.div>
              </div>
              <div className="lp-ticket-cut" />
              <div className="lp-ticket-foot">
                <b>¿Prefieren escanear?</b>
                <span>Desde la app de Burrito: Pasaporte → Registrar visita.</span>
              </div>
            </motion.section>

            {/* ── Hoy ── */}
            <motion.section {...stagger(4)} className="lp-stats">
              <Stat value={panel.visits_today} label="Visitas hoy" emoji="👣" />
              <Stat value={panel.rewards_redeemed_today} label="Premios canjeados" emoji={panel.reward_emoji} />
            </motion.section>

            <motion.section {...stagger(5)} className="lp-steps">
              {[
                ['1', 'El cliente abre Burrito', 'Pasaporte → tu local → Registrar visita'],
                ['2', 'Le das el PIN o el QR', 'Suma su sello al instante'],
                ['3', panel.enabled ? `A las ${panel.visits_required} visitas, premio` : 'Queda en su pasaporte', panel.enabled ? 'Para canjearlo también pide el PIN' : 'Y te recomienda a otros turistas'],
              ].map(([n, t, s]) => (
                <div key={n} className="lp-step">
                  <span>{n}</span>
                  <div><b>{t}</b><small>{s}</small></div>
                </div>
              ))}
            </motion.section>

            <motion.footer {...stagger(6)} className="lp-footer">
              <div className="lp-brand small">
                <img src="/isotipo_burrito.png" alt="" />
                <span>burri<b>to</b></span>
              </div>
              <p>La guía piurana que trae turistas a {name}.</p>
              <small>No compartas este enlace: quien lo tenga ve el PIN de tu local.</small>
            </motion.footer>
          </>
        )}
      </div>
    </div>
  )
}

/** Número que cuenta hasta su valor al aparecer y al cambiar. */
function Stat({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9, ease: [0.2, 0.8, 0.2, 1],
      onUpdate: v => { if (ref.current) ref.current.textContent = String(Math.round(v)) },
    })
    prev.current = value
    return () => controls.stop()
  }, [value])
  return (
    <div className="lp-stat">
      <span className="lp-stat-emoji">{emoji}</span>
      <span ref={ref} className="lp-stat-value">0</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  )
}
