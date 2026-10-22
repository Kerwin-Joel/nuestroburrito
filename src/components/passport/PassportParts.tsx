import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Delete, KeyRound, QrCode, X } from 'lucide-react'
import QRScannerModal from '../../pages/verify/QRScannerModal'
import {
  checkInMessage, codeFromScan, passportService, redeemMessage,
  type CheckInResult, type Loyalty, type Reward,
} from '../../services/passport'
import './passport.css'

/*
 * Piezas del pasaporte — espejo de passport/PassportParts.kt (app nativa):
 * tarjeta de sellos, teclado de PIN, registro de visita, celebración y canje.
 */

// ── Tarjeta de sellos ─────────────────────────────────────────────────────────

/** N casilleros; los ganados llevan el sello. `animateIndex` = el recién timbrado. */
export function StampCard({ loyalty, progress, animateIndex }: { loyalty: Loyalty; progress: number; animateIndex?: number | null }) {
  const total = loyalty.visits_required
  const cols = total <= 5 ? total : total <= 8 ? 4 : 5
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < progress
        const last = i === total - 1
        return (
          <div key={i} className={`pp-slot ${filled ? 'filled' : ''} ${i === progress ? 'next' : ''}`}>
            {filled ? (
              <>
                <div className={`pp-mark ${animateIndex === i ? 'animate' : ''}`}>
                  <img src="/isotipo_burrito.png" alt="" draggable={false} />
                </div>
                {animateIndex === i && <span className="pp-ink" />}
              </>
            ) : last ? (
              <span className="pp-gift" style={{ fontSize: 'clamp(20px, 6vw, 28px)' }}>{loyalty.reward_emoji}</span>
            ) : (
              <span style={{ font: '700 13px var(--font-body)', color: 'var(--muted)' }}>{i + 1}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Anillo de progreso alrededor del sello en la grilla del pasaporte. */
export function ProgressRing({ size, value, children }: { size: number; value: number; children: React.ReactNode }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--orange)" strokeWidth={4} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.15 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// ── PIN ───────────────────────────────────────────────────────────────────────

export function PinPad({ onComplete, busy, error }: { onComplete: (pin: string) => void; busy: boolean; error: string | null }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(0)
  // Error nuevo → sacude las casillas y las vacía (ajuste de estado durante el render).
  const [prevError, setPrevError] = useState(error)
  if (error !== prevError) {
    setPrevError(error)
    if (error) { setShake(s => s + 1); setPin('') }
  }
  const press = (d: string) => {
    if (busy || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) onComplete(next)
  }
  return (
    <div>
      <div key={shake} className={shake ? 'pp-shake' : undefined} style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pp-pin-box ${i === pin.length ? 'active' : ''} ${i < pin.length ? 'filled' : ''}`}>
            {i < pin.length ? '•' : ''}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#D14B3A', font: '600 13px var(--font-body)', textAlign: 'center', margin: '10px 0 0' }}>{error}</motion.p>
        )}
      </AnimatePresence>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => <button key={d} className="pp-key" onClick={() => press(d)}>{d}</button>)}
        <span />
        <button className="pp-key" onClick={() => press('0')}>0</button>
        <button className="pp-key" onClick={() => setPin(p => p.slice(0, -1))} aria-label="Borrar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <span className="pp-spinner" /> : <Delete size={22} />}
        </button>
      </div>
    </div>
  )
}

// ── Hoja inferior genérica ────────────────────────────────────────────────────

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(10,6,2,.55)', backdropFilter: 'blur(4px)' }} />
          <motion.div key="sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose() }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6001, margin: '0 auto', maxWidth: 480,
              background: 'var(--card)', borderRadius: '28px 28px 0 0', padding: '10px 20px calc(22px + env(safe-area-inset-bottom))',
              maxHeight: '92dvh', overflowY: 'auto',
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 12px' }}>
              <span style={{ width: 42, height: 5, borderRadius: 99, background: 'var(--border-hover)' }} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ── Registrar visita ──────────────────────────────────────────────────────────

/**
 * Elegir cómo validar (según lo que pide el spot): escanear el QR o el PIN del
 * personal. `spotId` fija el spot (pantalla de visitas); sin él, solo QR.
 */
export function CheckInSheet({ open, onClose, spotId, spotName, validation, itineraryId, onResult }: {
  open: boolean
  onClose: () => void
  spotId?: string
  spotName?: string
  validation?: Loyalty['validation']
  itineraryId?: string
  onResult: (r: Extract<CheckInResult, { ok: true }>) => void
}) {
  const [mode, setMode] = useState<'choose' | 'pin'>('choose')
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cada vez que se abre, empieza según lo que pide el local.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setMode(validation === 'pin' ? 'pin' : 'choose'); setError(null) }
  }

  const run = async (a: { code?: string; pin?: string }) => {
    setBusy(true); setError(null)
    try {
      const r = await passportService.checkIn({ ...a, spotId: a.pin ? spotId : undefined, itineraryId })
      if (r.ok) {
        if (spotId && r.spot_id !== spotId) { setError(`Ese código es de ${r.spot_name.trim()}, no de este spot.`); return }
        // Éxito: quien abrió el panel decide cómo seguir (y lo cierra).
        onResult(r)
      } else {
        setError(checkInMessage(r))
        if (r.reason === 'PIN_REQUIRED') setMode('pin')
      }
    } catch {
      setError('No se pudo registrar la visita. Revisa tu conexión.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <Sheet open={open && !scanning} onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ flex: 1, margin: 0, font: '800 22px var(--font-display)', color: 'var(--white)', letterSpacing: '-0.4px' }}>Registrar visita</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'var(--card2)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={17} color="var(--white)" /></button>
        </div>
        <p style={{ margin: '0 0 18px', font: '14px var(--font-body)', color: 'var(--muted)' }}>
          {mode === 'pin' ? `Pide el PIN al personal${spotName ? ` de ${spotName.trim()}` : ''}. Cambia cada vez que se usa.` : 'Escanea el QR del local para sumar tu sello.'}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'choose' ? (
            <motion.div key="choose" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <OptionButton icon={<QrCode size={24} />} title="Escanear QR" sub="El código del mostrador o de la mesa" onClick={() => setScanning(true)} primary />
              {spotId && <OptionButton icon={<KeyRound size={22} />} title="Ingresar PIN" sub="4 dígitos que te dicta el personal" onClick={() => setMode('pin')} />}
              {error && <p style={{ color: '#D14B3A', font: '600 13px var(--font-body)', margin: '4px 0 0' }}>{error}</p>}
            </motion.div>
          ) : (
            <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <PinPad busy={busy} error={error} onComplete={pin => run({ pin })} />
              {validation !== 'pin' && (
                <button onClick={() => { setMode('choose'); setError(null) }} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--orange)', font: '600 14px var(--font-body)', cursor: 'pointer', padding: 10 }}>
                  Mejor escanear el QR
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
      <QRScannerModal isOpen={scanning} onClose={() => setScanning(false)} onScan={raw => { setScanning(false); run({ code: codeFromScan(raw) }) }} />
    </>
  )
}

function OptionButton({ icon, title, sub, onClick, primary }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
      border: primary ? 'none' : '1px solid var(--border)',
      background: primary ? 'linear-gradient(135deg, #FF9A3C, #E8590C)' : 'var(--card2)', color: primary ? '#fff' : 'var(--white)',
    }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: primary ? 'rgba(255,255,255,.2)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span>
        <span style={{ display: 'block', font: '700 16px var(--font-body)' }}>{title}</span>
        <span style={{ display: 'block', font: '13px var(--font-body)', opacity: 0.8 }}>{sub}</span>
      </span>
    </motion.button>
  )
}

// ── Celebración ───────────────────────────────────────────────────────────────

function burst(colors = ['#FF9A3C', '#E8590C', '#F5A623', '#2E9E5B', '#ffffff']) {
  const fire = (ratio: number, opts: confetti.Options) =>
    confetti({ origin: { y: 0.62 }, zIndex: 7100, colors, ...opts, particleCount: Math.floor(220 * ratio) })
  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
}

/** "+1 sello" con la tarjeta animada; si completó la tarjeta, el regalo se abre. */
export function CheckInCelebration({ result, onClose }: { result: Extract<CheckInResult, { ok: true }> | null; onClose: () => void }) {
  const loyalty = result?.summary.loyalty ?? null
  const reward = result?.reward_earned ?? null
  useEffect(() => {
    if (!result || result.already) return
    const t = setTimeout(() => burst(), reward ? 450 : 520)
    return () => clearTimeout(t)
  }, [result, reward])

  // Al ganar el premio el progreso se reinicia: la tarjeta se muestra llena.
  const shown = loyalty ? (reward ? loyalty.visits_required : result!.summary.progress) : 0
  return createPortal(
    <AnimatePresence>
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 7000, background: 'rgba(10,6,2,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div onClick={e => e.stopPropagation()}
            initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{ width: '100%', maxWidth: 380, background: 'var(--card)', borderRadius: 28, padding: '26px 22px 20px', textAlign: 'center' }}>
            {reward ? (
              <>
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: [0, 1.25, 1], rotate: [-30, 10, 0] }} transition={{ duration: 0.7, times: [0, 0.6, 1] }}
                  style={{ fontSize: 72, lineHeight: 1 }}>{reward.emoji}</motion.div>
                <h3 style={{ margin: '12px 0 4px', font: '800 26px var(--font-display)', color: 'var(--white)' }}>¡Ganaste un premio!</h3>
                <p style={{ margin: 0, font: '700 16px var(--font-body)', color: 'var(--orange)' }}>{reward.title}</p>
                {reward.description && <p style={{ margin: '4px 0 0', font: '14px var(--font-body)', color: 'var(--muted)' }}>{reward.description}</p>}
              </>
            ) : (
              <>
                <motion.div initial={{ scale: 2.2, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: -12, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                  style={{ width: 96, height: 96, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: result.already ? 'none' : '4px solid #fff', boxShadow: result.already ? 'none' : '0 12px 28px rgba(232,89,12,.45)' }}>
                  {result.already ? <Check size={42} color="var(--muted)" /> : <img src="/isotipo_burrito.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </motion.div>
                <h3 style={{ margin: '14px 0 4px', font: '800 24px var(--font-display)', color: 'var(--white)' }}>
                  {result.already ? 'Ya tienes tu sello de hoy' : '¡+1 sello!'}
                </h3>
                <p style={{ margin: 0, font: '14px var(--font-body)', color: 'var(--muted)' }}>
                  {result.already ? `Tu visita a ${result.spot_name.trim()} ya estaba registrada.` : `Visita registrada en ${result.spot_name.trim()}`}
                </p>
              </>
            )}
            {loyalty && (
              <div style={{ marginTop: 20 }}>
                <StampCard loyalty={loyalty} progress={shown} animateIndex={result.already ? null : shown - 1} />
                {!reward && (
                  <p style={{ margin: '12px 0 0', font: '700 13px var(--font-body)', color: 'var(--orange)' }}>
                    {loyalty.visits_required - shown === 1 ? `¡La próxima visita ganas ${loyalty.reward_title}!` : `Te faltan ${loyalty.visits_required - shown} visitas para ${loyalty.reward_title}`}
                  </p>
                )}
              </div>
            )}
            <button onClick={onClose} style={{ width: '100%', height: 52, marginTop: 20, border: 'none', borderRadius: 16, background: 'var(--orange)', color: '#fff', font: '700 15px var(--font-body)', cursor: 'pointer' }}>
              {reward ? 'Ver mi premio' : 'Listo'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ── Canje ─────────────────────────────────────────────────────────────────────

/** El personal escribe su PIN en tu teléfono para entregar el premio. */
export function RedeemSheet({ reward, spotName, onClose, onRedeemed }: { reward: Reward | null; spotName: string; onClose: () => void; onRedeemed: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [prevReward, setPrevReward] = useState(reward)
  if (reward !== prevReward) {
    setPrevReward(reward)
    if (reward) { setError(null); setDone(false) }
  }

  const submit = async (pin: string) => {
    if (!reward) return
    setBusy(true); setError(null)
    try {
      const r = await passportService.redeem(reward.id, pin)
      if (r.ok) { setDone(true); burst(); onRedeemed() } else setError(redeemMessage(r))
    } catch { setError('No se pudo canjear. Revisa tu conexión.') } finally { setBusy(false) }
  }

  return (
    <Sheet open={!!reward} onClose={onClose}>
      {reward && (
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
                style={{ width: 72, height: 72, margin: '0 auto', borderRadius: '50%', background: '#2E9E5B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={38} color="#fff" />
              </motion.div>
              <h3 style={{ margin: '14px 0 4px', font: '800 24px var(--font-display)', color: 'var(--white)' }}>¡Premio canjeado!</h3>
              <p style={{ margin: 0, font: '14px var(--font-body)', color: 'var(--muted)' }}>Disfruta tu {reward.title.toLowerCase()} en {spotName.trim()}.</p>
              <button onClick={onClose} style={{ width: '100%', height: 52, marginTop: 20, border: 'none', borderRadius: 16, background: 'var(--orange)', color: '#fff', font: '700 15px var(--font-body)', cursor: 'pointer' }}>Listo</button>
            </motion.div>
          ) : (
            <motion.div key="pin" exit={{ opacity: 0 }}>
              <div className="pp-shine" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, background: 'linear-gradient(135deg, #FF9A3C, #E8590C)', color: '#fff' }}>
                <span style={{ fontSize: 40 }}>{reward.emoji}</span>
                <span>
                  <span style={{ display: 'block', font: '800 18px var(--font-display)' }}>{reward.title}</span>
                  <span style={{ display: 'block', font: '13px var(--font-body)', opacity: 0.9 }}>{spotName.trim()}</span>
                </span>
              </div>
              <p style={{ margin: '18px 0 14px', font: '600 14px var(--font-body)', color: 'var(--white)', textAlign: 'center' }}>
                Entrégale tu celular al personal para que ingrese su PIN
              </p>
              <PinPad busy={busy} error={error} onComplete={submit} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Sheet>
  )
}
