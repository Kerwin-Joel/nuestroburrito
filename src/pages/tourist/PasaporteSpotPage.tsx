import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, KeyRound, QrCode, Route } from 'lucide-react'
import { spotsService } from '../../services/spots'
import { CheckInCelebration, CheckInSheet, RedeemSheet, StampCard } from '../../components/passport/PassportParts'
import { passportService, type CheckInResult, type Reward, type SpotPassport } from '../../services/passport'
import type { Spot } from '../../types/spot'

/**
 * Visitas de un spot con premio — espejo de SpotVisitsScreen.kt: tarjeta de
 * sellos, registrar visita (QR o PIN según el local), premios para canjear
 * con el PIN del personal e historial de visitas.
 */
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })

export default function PasaporteSpotPage() {
  const { spotId = '' } = useParams()
  const navigate = useNavigate()
  const [spot, setSpot] = useState<Spot | null>(null)
  const [p, setP] = useState<SpotPassport | null>(null)
  const [checkIn, setCheckIn] = useState(false)
  const [celebrate, setCelebrate] = useState<Extract<CheckInResult, { ok: true }> | null>(null)
  const [redeem, setRedeem] = useState<Reward | null>(null)
  const [stampAnim, setStampAnim] = useState<number | null>(null)

  const refresh = useCallback(() => passportService.spot(spotId).then(setP).catch(() => {}), [spotId])
  useEffect(() => {
    spotsService.getSpotById(spotId).then(setSpot).catch(() => {})
    refresh()
  }, [spotId, refresh])

  const l = p?.loyalty ?? null
  const ready = p?.rewards.filter(r => !r.redeemed_at) ?? []
  const used = p?.rewards.filter(r => r.redeemed_at) ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 120 }}>
      {/* ── Portada ── */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {spot && (
          <motion.img initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            src={spot.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 40%, var(--bg) 100%)' }} />
        <button onClick={() => navigate(-1)} aria-label="Atrás" style={{
          position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ArrowLeft size={21} color="#1A120A" /></button>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ position: 'absolute', left: 20, right: 20, bottom: 14 }}>
          <div style={{ font: '700 11px var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--orange)' }}>Tu pasaporte</div>
          <h1 style={{ margin: '4px 0 0', font: '900 clamp(26px, 7vw, 34px) var(--font-display)', letterSpacing: '-1px', color: 'var(--white)' }}>{spot?.name.trim() ?? ' '}</h1>
        </motion.div>
      </div>

      <div className="page-container" style={{ maxWidth: 560 }}>
        {!p ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 22, marginTop: 8 }} />
        ) : (
          <>
            {/* ── Tarjeta de sellos ── */}
            {l ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="card" style={{ padding: 20, borderRadius: 24, marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <span className="pp-gift" style={{ fontSize: 34 }}>{l.reward_emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '800 18px var(--font-display)', color: 'var(--white)' }}>{l.reward_title}</div>
                    <div style={{ font: '13px var(--font-body)', color: 'var(--muted)' }}>{l.reward_description ?? `Al completar ${l.visits_required} visitas`}</div>
                  </div>
                </div>
                <StampCard loyalty={l} progress={p.progress} animateIndex={stampAnim} />
                <p style={{ margin: '16px 0 0', font: '700 13.5px var(--font-body)', color: 'var(--orange)', textAlign: 'center' }}>
                  {l.visits_required - p.progress === 1 ? '¡Tu próxima visita gana el premio!' : `Te faltan ${l.visits_required - p.progress} visitas para tu premio`}
                </p>
              </motion.div>
            ) : (
              <div className="card" style={{ padding: 20, borderRadius: 24, marginTop: 6, textAlign: 'center' }}>
                <div style={{ font: '800 34px var(--font-display)', color: 'var(--white)' }}>{p.visits}</div>
                <div style={{ font: '13px var(--font-body)', color: 'var(--muted)' }}>{p.visits === 1 ? 'visita registrada' : 'visitas registradas'}</div>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setCheckIn(true)} style={{
              width: '100%', height: 56, marginTop: 16, border: 'none', borderRadius: 18, cursor: 'pointer',
              background: 'linear-gradient(135deg, #FF9A3C, #E8590C)', color: '#fff', font: '700 15.5px var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-glow)',
            }}>
              {l?.validation === 'pin' ? <KeyRound size={20} /> : <QrCode size={20} />} Registrar visita
            </motion.button>
            <p style={{ margin: '8px 0 0', font: '12px var(--font-body)', color: 'var(--muted)', textAlign: 'center' }}>
              {l?.validation === 'pin' ? 'Este local valida con un PIN que te dicta el personal.' : 'Escanea el QR del local al llegar.'}
              {l && l.cooldown_hours > 0 ? ` Suma un sello cada ${l.cooldown_hours} h como máximo.` : ''}
            </p>

            {/* ── Premios ── */}
            <AnimatePresence>
              {(ready.length > 0 || used.length > 0) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 28 }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>Tus premios</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...ready, ...used].map((r, i) => (
                      <motion.div key={r.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: r.redeemed_at ? 0.55 : 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`pp-ticket ${r.redeemed_at ? '' : 'pp-shine'}`}>
                        <div style={{ width: 94, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, background: r.redeemed_at ? 'var(--card2)' : 'linear-gradient(135deg, #FF9A3C, #E8590C)', borderRight: '2px dashed var(--border-hover)' }}>{r.emoji}</div>
                        <div style={{ flex: 1, padding: '14px 14px 14px 18px', minWidth: 0 }}>
                          <div style={{ font: '800 16px var(--font-display)', color: 'var(--white)' }}>{r.title}</div>
                          <div style={{ font: '12px var(--font-body)', color: 'var(--muted)' }}>
                            {r.redeemed_at ? `Canjeado el ${fmtDate(r.redeemed_at)}` : `Ganado el ${fmtDate(r.earned_at)}`}
                          </div>
                          {!r.redeemed_at && (
                            <button onClick={() => setRedeem(r)} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 99, border: 'none', background: '#2E9E5B', color: '#fff', font: '700 13px var(--font-body)', cursor: 'pointer' }}>
                              Canjear ahora
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Historial ── */}
            {p.history && p.history.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <p className="section-label" style={{ marginBottom: 12 }}>Tus visitas · {p.visits}</p>
                <div style={{ position: 'relative', paddingLeft: 22 }}>
                  <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
                  {p.history.map((h, i) => (
                    <motion.div key={h.visited_at} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                      <span style={{ position: 'absolute', left: -21, width: 12, height: 12, borderRadius: '50%', background: i === 0 ? 'var(--orange)' : 'var(--card2)', border: '2px solid var(--bg)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '600 14px var(--font-body)', color: 'var(--white)', textTransform: 'capitalize' }}>{fmtDate(h.visited_at)}</div>
                        <div style={{ font: '12px var(--font-body)', color: 'var(--muted)' }}>{fmtTime(h.visited_at)} · {h.method === 'pin' ? 'con PIN' : 'con QR'}</div>
                      </div>
                      {h.source === 'itinerary' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: 'var(--card2)', font: '600 11px var(--font-body)', color: 'var(--muted)' }}>
                          <Route size={12} /> Itinerario
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CheckInSheet open={checkIn} onClose={() => setCheckIn(false)} spotId={spotId} spotName={spot?.name} validation={l?.validation}
        onResult={r => { setCheckIn(false); setCelebrate(r); setP({ ...r.summary, history: p?.history }); refresh() }} />
      <CheckInCelebration result={celebrate} onClose={() => {
        const r = celebrate
        setCelebrate(null)
        // Al cerrar, el último sello se "timbra" en la tarjeta.
        if (r && !r.already && !r.reward_earned && r.summary.loyalty) {
          setStampAnim(r.summary.progress - 1)
          setTimeout(() => setStampAnim(null), 1200)
        }
      }} />
      <RedeemSheet reward={redeem} spotName={spot?.name ?? ''} onClose={() => setRedeem(null)} onRedeemed={refresh} />
    </div>
  )
}
