import { lazy, Suspense, useState } from 'react'
import HoyEnPiura from '../../components/tourist/HoyEnPiura'
import { TouristBottomTabBar } from '../../components/shared/BottomTabBar'
import ItineraryWizardModal from '../../components/tourist/ItineraryWizardModal'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const HeroCanvas = lazy(() => import('../../components/tourist/HeroCanvas'))

export default function HomePage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Hero section */}
      <div style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>
        <div className="page-container" style={{ position: 'relative', zIndex: 1, paddingTop: '80px', paddingBottom: '60px', width: '100%' }}>
          <div style={{ maxWidth: '600px' }}>
            <p className="section-label" style={{ marginBottom: '16px' }}>PIURA, PERÚ</p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(48px, 7vw, 88px)',
              letterSpacing: '-4px',
              color: 'var(--white)',
              lineHeight: 0.95,
              marginBottom: '20px',
            }}>
              La guía<br />
              <span style={{ color: 'var(--orange)' }}>piurana</span>
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '420px', marginBottom: '28px' }}>
              Construida por piuranos, para quienes quieren el Piura real. No el del folleto.
            </p>

            {/* CTA Wizard */}
            <motion.button
              onClick={() => setWizardOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              style={{
                fontSize: '16px',
                padding: '14px 28px',
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow-lg)',
              }}
            >
              <Sparkles size={18} />
              Armar mi día en Piura
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="page-container" style={{ paddingTop: '48px', paddingBottom: '120px' }}>
        <HoyEnPiura />

        {/* Divider before QuizFlow */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          margin: '40px 0 32px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase',
          }}>O genera con IA</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* <QuizFlow /> */}

        {/* Quick wizard CTA banner — after QuizFlow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onClick={() => setWizardOpen(true)}
          style={{
            marginTop: '40px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: 'var(--shadow-card)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          whileHover={{ borderColor: 'var(--orange)', boxShadow: 'var(--shadow-glow)' } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0,
            }}>🌯</div>
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '17px', color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '2px',
              }}>
                ¿Prefieres el asistente paso a paso?
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>
                3 preguntas · 60 segundos · tu día listo
              </p>
            </div>
          </div>
          <div style={{
            flexShrink: 0, background: 'var(--orange)', borderRadius: '10px',
            padding: '8px 16px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: '#FDFAF4',
          }}>
            Probar →
          </div>
        </motion.div>
      </div>

      <TouristBottomTabBar />

      {/* Itinerary Wizard Modal */}
      <ItineraryWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  )
}
