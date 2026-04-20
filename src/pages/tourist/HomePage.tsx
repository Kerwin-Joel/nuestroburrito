import { lazy, Suspense } from 'react'
import Navbar from '../../components/shared/Navbar'
import HoyEnPiura from '../../components/tourist/HoyEnPiura'
import QuizFlow from '../../components/tourist/QuizFlow'
import { TouristBottomTabBar } from '../../components/shared/BottomTabBar'
import BurritoDonkey from '../../components/shared/Burritodonkey'

const HeroCanvas = lazy(() => import('../../components/tourist/HeroCanvas'))

export default function HomePage() {
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
            {/* <div style={{ width: "100%", height: "500px" }}>
              <BurritoDonkey autoRotate={true} />
            </div> */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '420px' }}>
              Construida por piuranos, para quienes quieren el Piura real. No el del folleto.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="page-container" style={{ paddingTop: '48px', paddingBottom: '120px' }}>
        <HoyEnPiura />
        <QuizFlow />
      </div>

    </div>
  )
}
