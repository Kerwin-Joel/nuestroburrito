import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Gift, KeyRound, Maximize2, Minimize2, QrCode, Route, Search, Store } from 'lucide-react'
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
  visits_total: number
  customers_total: number
  customers_returning: number
  customers: Customer[]
  recent: Activity[]
}

interface Customer {
  name: string
  avatar_url: string | null
  visits: number
  visits_today: number
  first_visit: string
  last_visit: string
  progress: number
  rewards_ready: number
  rewards_redeemed: number
}

type Activity =
  | { kind: 'visit'; at: string; method: 'qr' | 'pin'; source: 'passport' | 'itinerary'; name: string; avatar_url: string | null }
  | { kind: 'redeem'; at: string; title: string; emoji: string; name: string; avatar_url: string | null }

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
  // Hora de la última actualización: para los "hace X min" (se renueva con cada consulta).
  const [now, setNow] = useState(0)
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
      setNow(Date.now())
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

            <motion.div {...stagger(5)}>
              <Customers panel={panel} now={now} />
            </motion.div>

            <motion.section {...stagger(6)} className="lp-steps">
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

            <motion.footer {...stagger(7)} className="lp-footer">
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

// ── Clientes ──────────────────────────────────────────────────────────────────

function ago(iso: string, now: number): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  const d = Math.floor(min / 1440)
  if (d === 1) return 'ayer'
  if (d < 7) return `hace ${d} días`
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function Avatar({ name, url, size = 42 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    <img src={url} alt="" className="lp-avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="lp-avatar lp-avatar-initial" style={{ width: size, height: size, fontSize: size * 0.42 }}>{name.charAt(0).toUpperCase()}</span>
  )
}

/** Quién vino y cuántas veces: lista de clientes y la actividad reciente. */
function Customers({ panel, now }: { panel: Panel; now: number }) {
  const [tab, setTab] = useState<'clientes' | 'actividad'>('clientes')
  const [query, setQuery] = useState('')
  const list = panel.customers.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()))
  const req = panel.visits_required

  return (
    <section className="lp-customers">
      <span className="lp-eyebrow">Tus clientes Burrito</span>
      <h2 className="lp-h2" style={{ marginTop: 4 }}>{panel.customers_total === 1 ? '1 persona te visitó' : `${panel.customers_total} personas te visitaron`}</h2>
      <div className="lp-kpis">
        <span><b>{panel.visits_total}</b> visitas</span>
        <span><b>{panel.customers_returning}</b> volvieron</span>
        {panel.customers_total > 0 && <span><b>{Math.round((panel.customers_returning / panel.customers_total) * 100)}%</b> regresan</span>}
      </div>

      <div className="lp-seg">
        {(['clientes', 'actividad'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'on' : ''}>
            {tab === t && <motion.span layoutId="lp-seg" className="lp-seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span style={{ position: 'relative' }}>{t === 'clientes' ? 'Clientes' : 'Actividad'}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'clientes' ? (
          <motion.div key="c" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            {panel.customers.length > 6 && (
              <div className="lp-search">
                <Search size={16} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente…" />
              </div>
            )}
            {panel.customers.length === 0 ? (
              <p className="lp-empty">Cuando un cliente registre su visita con tu PIN o QR, aparecerá aquí.</p>
            ) : (
              <div className="lp-list">
                {list.map((c, i) => {
                  const frequent = c.visits >= 3
                  const isNew = c.visits === 1 && now - new Date(c.first_visit).getTime() < 86_400_000
                  return (
                    <motion.div key={`${c.name}-${c.first_visit}`} layout className="lp-row"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.035 }}>
                      <Avatar name={c.name} url={c.avatar_url} />
                      <div className="lp-row-main">
                        <div className="lp-row-top">
                          <b>{c.name}</b>
                          {frequent && <span className="lp-tag gold">⭐ Frecuente</span>}
                          {isNew && <span className="lp-tag">Nuevo</span>}
                        </div>
                        <small>{c.visits === 1 ? '1 visita' : `${c.visits} visitas`} · última {ago(c.last_visit, now)}</small>
                        {panel.enabled && (
                          <div className="lp-mini">
                            {Array.from({ length: req }, (_, k) => <i key={k} className={k < c.progress ? 'on' : ''} />)}
                          </div>
                        )}
                      </div>
                      <div className="lp-row-side">
                        <span className="lp-count">{c.visits}</span>
                        {c.rewards_ready > 0 && <span className="lp-tag green"><Gift size={11} /> Premio listo</span>}
                        {c.rewards_redeemed > 0 && <span className="lp-tag muted">{c.rewards_redeemed} canjeado{c.rewards_redeemed === 1 ? '' : 's'}</span>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="a" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
            {panel.recent.length === 0 ? (
              <p className="lp-empty">Todavía no hay visitas.</p>
            ) : (
              <div className="lp-feed">
                <AnimatePresence initial={false}>
                  {panel.recent.map(a => (
                    <motion.div key={`${a.kind}-${a.at}`} layout className="lp-feed-row"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                      <span className={`lp-feed-icon ${a.kind}`}>
                        {a.kind === 'redeem' ? <Gift size={15} /> : a.method === 'pin' ? <KeyRound size={15} /> : <QrCode size={15} />}
                      </span>
                      <div className="lp-row-main">
                        <b>{a.name}</b>
                        <small>
                          {a.kind === 'redeem' ? `canjeó ${a.emoji} ${a.title}` : `registró su visita con ${a.method === 'pin' ? 'PIN' : 'QR'}`}
                          {a.kind === 'visit' && a.source === 'itinerary' && <> · <Route size={11} style={{ verticalAlign: -1 }} /> itinerario</>}
                        </small>
                      </div>
                      <small className="lp-feed-time">{ago(a.at, now)}</small>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="lp-privacy">Por privacidad solo ves el nombre y la inicial del apellido de cada cliente.</p>
    </section>
  )
}
