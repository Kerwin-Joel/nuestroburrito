import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { INTEREST_OPTIONS, TIME_OPTIONS, GROUP_OPTIONS, BUDGET_OPTIONS } from '../../lib/constants'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useItinerary } from '../../hooks/useItinerary'
import type { ItineraryPreferences } from '../../types/itinerary'

export default function QuizFlow() {
  const navigate = useNavigate()
  const { setPreferences } = useItineraryStore()
  const { generate, isGenerating } = useItinerary()

  const [interests, setInterests] = useState<string[]>([])
  const [time, setTime] = useState<string>('')
  const [group, setGroup] = useState<string>('')
  const [budget, setBudget] = useState<string>('')

  const canGenerate = interests.length > 0 && time && group && budget

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!canGenerate) return
    const prefs: ItineraryPreferences = {
      interests,
      time: time as ItineraryPreferences['time'],
      group: group as ItineraryPreferences['group'],
      budget: budget as ItineraryPreferences['budget'],
    }
    setPreferences(prefs)
    await generate(prefs)
    navigate('/app/itinerario')
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Heading */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(36px, 5vw, 64px)',
          letterSpacing: '-3px',
          color: 'var(--white)',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          ¿Qué buscas hoy?
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--muted)', maxWidth: '480px' }}>
          Dinos qué te mueve y en 60 segundos tienes tu día armado.
        </p>
      </div>

      {/* Interests */}
      <Section label="¿Qué te llama la atención?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {INTEREST_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => toggleInterest(opt.id)}
              whileTap={{ scale: 0.94 }}
              className={`chip ${interests.includes(opt.id) ? 'selected' : ''}`}
            >
              <span>{opt.emoji}</span> {opt.label}
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Time */}
      <Section label="¿Cuánto tiempo tienes?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {TIME_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => setTime(opt.id)}
              whileTap={{ scale: 0.96 }}
              style={{
                background: time === opt.id ? 'rgba(255,85,0,0.10)' : 'var(--card2)',
                border: `1px solid ${time === opt.id ? 'var(--orange)' : 'rgba(255,120,30,0.15)'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.emoji}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: time === opt.id ? 'var(--orange)' : 'var(--white)' }}>{opt.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{opt.sub}</div>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Group */}
      <Section label="¿Con quién vas?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {GROUP_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => setGroup(opt.id)}
              whileTap={{ scale: 0.96 }}
              style={{
                background: group === opt.id ? 'rgba(255,85,0,0.10)' : 'var(--card2)',
                border: `1px solid ${group === opt.id ? 'var(--orange)' : 'rgba(255,120,30,0.15)'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '22px' }}>{opt.emoji}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: group === opt.id ? 'var(--orange)' : 'var(--white)' }}>{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Budget */}
      <Section label="¿Tu presupuesto?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {BUDGET_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => setBudget(opt.id)}
              whileTap={{ scale: 0.96 }}
              style={{
                background: budget === opt.id ? 'rgba(255,85,0,0.10)' : 'var(--card2)',
                border: `1px solid ${budget === opt.id ? 'var(--orange)' : 'rgba(255,120,30,0.15)'}`,
                borderRadius: '12px',
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{opt.emoji}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: budget === opt.id ? 'var(--orange)' : 'var(--white)' }}>{opt.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{opt.sub}</div>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <motion.button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.98 } : {}}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: '8px', fontSize: '17px' }}
      >
        {isGenerating ? '✨ Armando tu día...' : <><img src="/imagotipo.png" alt="" style={{ height: '22px', width: 'auto', verticalAlign: 'middle', marginRight: '8px' }} />Generar mi itinerario</>}
      </motion.button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p className="section-label" style={{ marginBottom: '14px' }}>{label}</p>
      {children}
    </div>
  )
}
