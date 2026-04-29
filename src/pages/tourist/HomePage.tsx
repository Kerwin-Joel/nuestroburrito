import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import HoyEnPiura from '../../components/tourist/HoyEnPiura'
import { TouristBottomTabBar } from '../../components/shared/BottomTabBar'
import ItineraryWizardModal from '../../components/tourist/ItineraryWizardModal'
import BurritoDonkey from '../../components/shared/Burritodonkey'
import { motion } from 'framer-motion'
import { Sparkles, CalendarDays } from 'lucide-react'

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

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px' }}>

              {/* Primary — Wizard IA */}
              <motion.button
                onClick={() => setWizardOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
                style={{
                  fontSize: '16px',
                  padding: '14px 24px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  boxShadow: 'var(--shadow-glow-lg)',
                }}
              >
                <Sparkles size={17} />
                Armar mi día con IA
              </motion.button>

              {/* Secondary — Manual itinerary */}
              <Link
                to="/app/itinerario"
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '13px 24px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    color: 'var(--white)',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <CalendarDays size={17} color="var(--orange)" />
                  Armar mi propio itinerario
                </motion.div>
              </Link>

            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="page-container" style={{ paddingTop: '48px', paddingBottom: '120px' }}>
        <HoyEnPiura />

        {/* Wizard CTA banner */}
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
            padding: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: 'var(--shadow-card)',
          }}
          whileHover={{ borderColor: 'var(--orange)', boxShadow: 'var(--shadow-glow)' } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Burrito 3D mini */}
            <div style={{ width: '56px', height: '56px', flexShrink: 0 }}>
              <BurritoDonkey autoRotate />
            </div>
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '16px', color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '3px',
              }}>
                ¿Prefieres el asistente paso a paso?
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
                3 preguntas · 60 segundos · tu día listo
              </p>
            </div>
          </div>
          <div style={{
            flexShrink: 0, background: 'var(--orange)', borderRadius: '10px',
            padding: '8px 14px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: '#FDFAF4',
            whiteSpace: 'nowrap',
          }}>
            Probar →
          </div>
        </motion.div>
      </div>

      <TouristBottomTabBar />

      <ItineraryWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  )
}
