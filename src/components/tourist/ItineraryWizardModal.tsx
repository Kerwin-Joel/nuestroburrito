import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Shuffle, Sparkles } from 'lucide-react'
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
  'Revisando horarios de apertura…',
  'Calculando rutas entre distritos…',
  'Buscando los mejores horarios…',
  'Añadiendo tips secretos…',
  'Armando tu itinerario perfecto…',
]

/* Apple-style spring presets */
const springSmooth = { type: 'spring' as const, stiffness: 340, damping: 32 }
const springBounce = { type: 'spring' as const, stiffness: 420, damping: 24 }

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
  const isGeneratingRef = useRef(false)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0); setWho(''); setGroup(''); setTime(''); setBudget('')
      setInterests([]); setGenPct(0); setGenMsg(0)
      isGeneratingRef.current = false
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 3) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, step])

  // Message rotation during generation
  useEffect(() => {
    if (step !== 3) return
    const mv = setInterval(() => setGenMsg(i => (i + 1) % GEN_MSGS.length), 2200)
    return () => clearInterval(mv)
  }, [step])

  // Start generation when step becomes 3
  useEffect(() => {
    if (step !== 3 || isGeneratingRef.current) return
    isGeneratingRef.current = true

    const doGenerate = async () => {
      const prefs: ItineraryPreferences = {
        interests: interests as any,
        time: time as ItineraryPreferences['time'],
        group: group as ItineraryPreferences['group'],
        budget: budget as ItineraryPreferences['budget'],
      }
      setPreferences(prefs)

      try {
        const stops = await generateItineraryFromSpots(
          { who, group, time, budget, interests, userLat: userLat ?? undefined, userLng: userLng ?? undefined },
          (pct) => setGenPct(pct) // ← Real progress from the service
        )

        setGenPct(100)

        // Short delay for the 100% animation to be visible
        await new Promise(r => setTimeout(r, 600))

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
            eventDate: s.eventDate ?? null,
            eventDateEnd: s.eventDateEnd ?? null,
          })))
        } else {
          await generate(prefs)
        }
      } catch (e) {
        console.error('Error generando desde spots:', e)
        await generate(prefs as any)
      }

      onClose()
      navigate('/app/itinerario')
    }

    doGenerate()
  }, [step])

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
            transition={{ duration: 0.25 }}
            onClick={step !== 3 ? onClose : undefined}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(8,7,5,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={springSmooth}
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
                {step !== 3 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                      background: 'var(--card2)', border: '1px solid var(--border)',
                      borderRadius: '10px', width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <X size={16} />
                  </motion.button>
                )}
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
                      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                      style={{ height: '100%', background: 'linear-gradient(to right, var(--orange), var(--hot))', borderRadius: '99px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {STEP_LABELS.map((l, i) => (
                      <span key={l} style={{
                        fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: i === step ? 'var(--orange)' : i < step ? 'var(--text-brand)' : 'var(--muted)',
                        fontWeight: i === step ? 700 : 500,
                        transition: 'color 0.3s ease',
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
                    initial={{ opacity: 0, x: 24, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -24, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  >

                    {/* STEP 0 — Quién eres */}
                    {step === 0 && (
                      <div>
                        <h2 style={titleStyle}>¿Cómo llegas a Piura?</h2>
                        <p style={subStyle}>Para personalizar mejor tu experiencia</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {WHO_OPT.map(o => (
                            <motion.button key={o.id} onClick={() => setWho(o.id)}
                              whileTap={{ scale: 0.97 }}
                              transition={{ duration: 0.1 }}
                              style={choiceStyle(who === o.id)}>
                              <span style={{ fontSize: '22px' }}>{o.emoji}</span>
                              <div>
                                <div style={choiceLabelStyle(who === o.id)}>{o.label}</div>
                                <div style={choiceSubStyle}>{o.sub}</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <p style={subStyle}>¿Viajes solo o acompañado?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {GROUP_OPTIONS.map(o => (
                            <motion.button key={o.id} onClick={() => setGroup(o.id)}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              style={{ ...choiceStyle(group === o.id), justifyContent: 'center', flexDirection: 'column', gap: '6px', padding: '14px 10px' }}>
                              <span style={{ fontSize: '24px' }}>{o.emoji}</span>
                              <span style={choiceLabelStyle(group === o.id)}>{o.label}</span>
                            </motion.button>
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
                            <motion.button key={o.id} onClick={() => setTime(o.id)}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              style={choiceStyle(time === o.id)}>
                              <span style={{ fontSize: '22px' }}>{o.emoji}</span>
                              <div>
                                <div style={choiceLabelStyle(time === o.id)}>{o.label}</div>
                                <div style={choiceSubStyle}>{o.sub}</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <p style={subStyle}>¿Tu presupuesto?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                          {BUDGET_OPTIONS.map(o => (
                            <motion.button key={o.id} onClick={() => setBudget(o.id)}
                              whileTap={{ scale: 0.93 }}
                              transition={{ duration: 0.1 }}
                              style={{ ...choiceStyle(budget === o.id), flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '14px 8px' }}>
                              <span style={{ fontSize: '22px', marginBottom: '4px' }}>{o.emoji}</span>
                              <div style={choiceLabelStyle(budget === o.id)}>{o.label}</div>
                              <div style={choiceSubStyle}>{o.sub}</div>
                            </motion.button>
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
                          {INTEREST_OPTIONS.map(o => {
                            const active = interests.includes(o.id)
                            return (
                              <motion.button key={o.id} onClick={() => toggleInterest(o.id)}
                                whileTap={{ scale: 0.93 }}
                                transition={{ duration: 0.1 }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '9px 16px', borderRadius: '100px',
                                  border: active ? '1px solid var(--orange)' : '1px solid var(--border)',
                                  background: active ? 'rgba(255,85,0,0.10)' : 'transparent',
                                  color: active ? 'var(--orange)' : 'var(--muted)',
                                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                                  boxShadow: active ? '0 2px 12px rgba(255,85,0,0.12)' : 'none',
                                }}>
                                <span>{o.emoji}</span> {o.label}
                              </motion.button>
                            )
                          })}
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setInterests([])}
                          style={{ ...choiceStyle(false), justifyContent: 'center', opacity: 0.65, width: '100%' }}>
                          <Shuffle size={16} /> Sorpréndeme — elige por mí
                        </motion.button>
                      </div>
                    )}

                    {/* STEP 3 — Generando (real progress) */}
                    {step === 3 && (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        {/* Burrito animation */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={springBounce}
                          style={{
                            width: '140px', height: '140px',
                            margin: '0 auto 24px',
                            filter: 'drop-shadow(0 0 20px rgba(255,85,0,0.5))',
                          }}
                        >
                          <BurritoDonkey autoRotate />
                        </motion.div>

                        {/* Message with crossfade */}
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={genMsg}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: '12px',
                              color: 'var(--orange)', letterSpacing: '1px',
                              textTransform: 'uppercase', marginBottom: '24px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}
                          >
                            <Sparkles size={13} /> {GEN_MSGS[genMsg]}
                          </motion.p>
                        </AnimatePresence>

                        {/* Progress bar — real progress */}
                        <div style={{
                          width: '100%', height: '6px',
                          background: 'var(--card2)', borderRadius: '99px',
                          overflow: 'hidden',
                        }}>
                          <motion.div
                            animate={{ width: `${genPct}%` }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                            style={{
                              height: '100%',
                              background: 'linear-gradient(to right, var(--orange), var(--hot))',
                              borderRadius: '99px',
                              boxShadow: '0 0 12px rgba(255,85,0,0.35)',
                            }}
                          />
                        </div>

                        {/* Percentage */}
                        <motion.p
                          key={Math.round(genPct)}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: 'var(--font-mono)', fontSize: '24px',
                            fontWeight: 800, color: 'var(--white)', marginTop: '14px',
                          }}
                        >
                          {Math.min(100, Math.round(genPct))}%
                        </motion.p>

                        {/* Subtle hint */}
                        {genPct < 100 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 3 }}
                            style={{
                              fontFamily: 'var(--font-body)', fontSize: '11px',
                              color: 'var(--muted)', marginTop: '16px',
                            }}
                          >
                            Esto puede tomar unos segundos…
                          </motion.p>
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              {step !== 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, ...springSmooth }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 20px',
                    paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
                    borderTop: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  {step > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={back}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'var(--card2)', border: '1px solid var(--border)',
                        borderRadius: '12px', padding: '12px 16px',
                        cursor: 'pointer', color: 'var(--muted)',
                        fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      <ArrowLeft size={15} /> Atrás
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: canNext() ? 0.96 : 1 }}
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
                      transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                    }}
                  >
                    {step === 2 ? (
                      <><Sparkles size={15} /> Generar mi itinerario</>
                    ) : (
                      <>Continuar <ArrowRight size={15} /></>
                    )}
                  </motion.button>
                </motion.div>
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
  background: active ? 'rgba(255,85,0,0.08)' : 'var(--card2)',
  cursor: 'pointer', textAlign: 'left',
  transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
  boxShadow: active ? '0 2px 12px rgba(255,85,0,0.1)' : 'none',
})
const choiceLabelStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px',
  color: active ? 'var(--orange)' : 'var(--white)',
  transition: 'color 0.2s ease',
})
const choiceSubStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '1px',
}
