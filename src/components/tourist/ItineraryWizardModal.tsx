import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { INTEREST_OPTIONS, TIME_OPTIONS, GROUP_OPTIONS, BUDGET_OPTIONS } from '../../lib/constants'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useItinerary } from '../../hooks/useItinerary'
import type { ItineraryPreferences } from '../../types/itinerary'
import BurritoDonkey from '../shared/Burritodonkey'
import { generateItineraryFromSpots } from '../../services/itineraryWizardService'
import { useGeolocation } from '../../hooks/useGeolocation'

const WHO_OPT = [
  { id: 'tourist', emoji: '🧳', label: 'Turista', sub: 'De otra ciudad' },
  { id: 'local', emoji: '🏠', label: 'Soy de Piura', sub: 'Conozco la región' },
  { id: 'transit', emoji: '✈️', label: 'De paso', sub: 'Pocas horas' },
]

const STEP_LABELS = ['Tú', 'Tiempo', 'Intereses', 'Generando', 'Listo']
const GEN_MSGS = [
  'Consultando con los locales…',
  'Calculando rutas entre distritos…',
  'Buscando los mejores horarios…',
  'Añadiendo tips secretos…',
  'Armando tu itinerario perfecto…',
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ItineraryWizardModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate()
  const { setPreferences } = useItineraryStore()
  const { generate, generateFromSpots, isGenerating } = useItinerary()
  const { lat: userLat, lng: userLng } = useGeolocation()
  const [step, setStep] = useState(0)
  const [who, setWho] = useState('')
  const [group, setGroup] = useState('')
  const [time, setTime] = useState('')
  const [budget, setBudget] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [genPct, setGenPct] = useState(0)
  const [genMsg, setGenMsg] = useState(0)

  // Reset on open
  useEffect(() => {
    if (isOpen) { setStep(0); setWho(''); setGroup(''); setTime(''); setBudget(''); setInterests([]) }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Generating animation
  useEffect(() => {
    if (step !== 3) return
    setGenPct(0)
    const iv = setInterval(() => setGenPct(p => { if (p >= 100) { clearInterval(iv); return 100 } return p + 2.5 }), 65)
    const mv = setInterval(() => setGenMsg(i => (i + 1) % GEN_MSGS.length), 1100)
    return () => { clearInterval(iv); clearInterval(mv) }
  }, [step])

  // Auto-advance after generation
  useEffect(() => {
    if (step !== 3 || genPct < 100) return
    const t = setTimeout(async () => {
      const prefs: ItineraryPreferences = {
        interests: interests as any,
        time: time as ItineraryPreferences['time'],
        group: group as ItineraryPreferences['group'],
        budget: budget as ItineraryPreferences['budget'],
      }
      setPreferences(prefs)

      try {
        // Intenta generar con spots reales de Supabase
        const stops = await generateItineraryFromSpots({
          who,
          group,
          time,
          budget,
          interests,
          userLat: userLat ?? undefined,
          userLng: userLng ?? undefined,
        })

        if (stops.length > 0) {
          await generateFromSpots(prefs, stops.map((s, i) => ({
            id: `stop-${Date.now()}-${i}`,
            spotId: s.spotId ?? '',
            spotName: s.place,
            time: s.time,
            description: s.desc,
            localTip: s.tip,
            travelToNext: s.travelToNext ?? '',
            photoUrl: '',
            lat: 0,
            lng: 0,
            visited: false,
          })))
        } else {
          // Fallback a Claude si no hay spots disponibles
          await generate(prefs)
        }
      } catch (e) {
        console.error('Error generando desde spots:', e)
        // Fallback a Claude
        await generate(prefs)
      }

      onClose()
      navigate('/app/itinerario')
    }, 400)
    return () => clearTimeout(t)
  }, [genPct, step])

  const toggleInterest = useCallback((id: string) => {
    setInterests(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])
  }, [])

  const canNext = () => {
    if (step === 0) return who && group
    if (step === 1) return time && budget
    return true
  }

  const next = () => { if (step < 3) setStep(s => s + 1) }
  const back = () => { if (step > 0 && step !== 3) setStep(s => s - 1) }

  const pct = (step / (STEP_LABELS.length - 1)) * 100

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(8,7,5,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2001,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{
                pointerEvents: 'auto',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '24px 24px 0 0',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '92dvh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -24px 80px rgba(0,0,0,0.7)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px 12px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px',
                  letterSpacing: '-0.8px', color: 'var(--white)',
                }}>
                  burri<span style={{ color: 'var(--orange)' }}>to</span>
                </span>
                <button onClick={onClose} style={{
                  background: 'var(--card2)', border: '1px solid var(--border)',
                  borderRadius: '10px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--muted)',
                }}>
                  <X size={16} />
                </button>
              </div>

              {/* Progress bar */}
              {step !== 3 && (
                <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
                  <div style={{
                    height: '3px', background: 'var(--card2)', borderRadius: '99px',
                    overflow: 'hidden', marginBottom: '8px',
                  }}>
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'var(--orange)', borderRadius: '99px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {STEP_LABELS.map((l, i) => (
                      <span key={l} style={{
                        fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: i === step ? 'var(--orange)' : i < step ? 'var(--text-brand)' : 'var(--muted)',
                        fontWeight: i === step ? 700 : 500,
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >

                    {/* STEP 0 — Quién eres */}
                    {step === 0 && (
                      <div>
                        <h2 style={titleStyle}>¿Cómo llegas a Piura?</h2>
                        <p style={subStyle}>Para personalizar mejor tu experiencia</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {WHO_OPT.map(o => (
                            <button key={o.id} onClick={() => setWho(o.id)}
                              style={choiceStyle(who === o.id)}>
                              <span style={{ fontSize: '22px' }}>{o.emoji}</span>
                              <div>
                                <div style={choiceLabelStyle(who === o.id)}>{o.label}</div>
                                <div style={choiceSubStyle}>{o.sub}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <p style={subStyle}>¿Viajes solo o acompañado?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {GROUP_OPTIONS.map(o => (
                            <button key={o.id} onClick={() => setGroup(o.id)}
                              style={{ ...choiceStyle(group === o.id), justifyContent: 'center', flexDirection: 'column', gap: '6px', padding: '14px 10px' }}>
                              <span style={{ fontSize: '24px' }}>{o.emoji}</span>
                              <span style={choiceLabelStyle(group === o.id)}>{o.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 1 — Tiempo y presupuesto */}
                    {step === 1 && (
                      <div>
                        <h2 style={titleStyle}>Tiempo y presupuesto</h2>
                        <p style={subStyle}>¿Cuánto tiempo tienes?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          {TIME_OPTIONS.map(o => (
                            <button key={o.id} onClick={() => setTime(o.id)}
                              style={choiceStyle(time === o.id)}>
                              <span style={{ fontSize: '22px' }}>{o.emoji}</span>
                              <div>
                                <div style={choiceLabelStyle(time === o.id)}>{o.label}</div>
                                <div style={choiceSubStyle}>{o.sub}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <p style={subStyle}>¿Tu presupuesto?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                          {BUDGET_OPTIONS.map(o => (
                            <button key={o.id} onClick={() => setBudget(o.id)}
                              style={{ ...choiceStyle(budget === o.id), flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '14px 8px' }}>
                              <span style={{ fontSize: '22px', marginBottom: '4px' }}>{o.emoji}</span>
                              <div style={choiceLabelStyle(budget === o.id)}>{o.label}</div>
                              <div style={choiceSubStyle}>{o.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 2 — Intereses */}
                    {step === 2 && (
                      <div>
                        <h2 style={titleStyle}>¿Qué quieres vivir?</h2>
                        <p style={subStyle}>Elige uno o varios (o ninguno y te sorprendemos)</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                          {INTEREST_OPTIONS.map(o => (
                            <button key={o.id} onClick={() => toggleInterest(o.id)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '9px 16px', borderRadius: '100px',
                                border: interests.includes(o.id) ? '1px solid var(--orange)' : '1px solid var(--border)',
                                background: interests.includes(o.id) ? 'var(--border)' : 'transparent',
                                color: interests.includes(o.id) ? 'var(--orange)' : 'var(--muted)',
                                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}>
                              <span>{o.emoji}</span> {o.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setInterests([])}
                          style={{ ...choiceStyle(false), justifyContent: 'center', opacity: 0.65, width: '100%' }}>
                          <Shuffle size={16} /> Sorpréndeme — elige por mí
                        </button>
                      </div>
                    )}

                    {/* STEP 3 — Generando */}
                    {step === 3 && (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: '140px', height: '140px', margin: '0 auto 24px', filter: 'drop-shadow(0 0 16px rgba(255,85,0,0.6))' }}>
                          <BurritoDonkey autoRotate />
                        </div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--orange)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                          {GEN_MSGS[genMsg]}
                        </p>
                        <div style={{ width: '100%', height: '6px', background: 'var(--card2)', borderRadius: '99px', overflow: 'hidden' }}>
                          <motion.div
                            animate={{ width: `${genPct}%` }}
                            transition={{ duration: 0.3, ease: 'linear' }}
                            style={{ height: '100%', background: 'linear-gradient(to right, var(--orange), var(--hot))', borderRadius: '99px', boxShadow: '0 0 8px var(--shadow-glow)' }}
                          />
                        </div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: 'var(--white)', marginTop: '12px' }}>
                          {Math.min(100, Math.round(genPct))}%
                        </p>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              {step !== 3 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  flexShrink: 0,
                }}>
                  {step > 0 && (
                    <button onClick={back} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--card2)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '12px 16px',
                      cursor: 'pointer', color: 'var(--muted)',
                      fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                    }}>
                      <ArrowLeft size={15} /> Atrás
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={!canNext()}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: canNext() ? 'var(--orange)' : 'var(--card2)',
                      border: 'none', borderRadius: '12px', padding: '14px',
                      cursor: canNext() ? 'pointer' : 'not-allowed',
                      color: canNext() ? '#FDFAF4' : 'var(--muted)',
                      fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700,
                      boxShadow: canNext() ? 'var(--shadow-glow)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {step === 2 ? 'Generar mi itinerario' : 'Continuar'} {step < 2 && <ArrowRight size={15} />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Style helpers ─── */
const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px',
  letterSpacing: '-0.8px', color: 'var(--white)', marginBottom: '6px',
}
const subStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)',
  marginBottom: '12px',
}
const choiceStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '12px',
  width: '100%', padding: '14px 16px', borderRadius: '14px',
  border: active ? '1px solid var(--orange)' : '1px solid var(--border)',
  background: active ? 'var(--border)' : 'var(--card2)',
  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
})
const choiceLabelStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px',
  color: active ? 'var(--orange)' : 'var(--white)',
})
const choiceSubStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '1px',
}
