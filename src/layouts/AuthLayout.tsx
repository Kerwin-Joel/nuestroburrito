import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { motion } from 'framer-motion'

export default function AuthLayout() {

  const { isAuthenticated, user, isLoading } = useAuthStore()
  console.log('AuthLayout:', { isLoading, isAuthenticated, role: user })

  // Cuando Google OAuth regresa, Supabase
  // setea la sesión y este redirect la captura
  if (!isLoading && isAuthenticated && user) {
    console.log('→ Redirigiendo a:', user)
    const role = user.profile.role
    if (role === 'tourist')
      return <Navigate to="/app" replace />
    if (role === 'churre') {
      if (user.profile.status === 'pending')
        return <Navigate to="/waiting-approval" replace />
      return <Navigate to="/churres" replace />
    }
    if (role === 'admin')
      return <Navigate to="/admin/dashboard" replace />
  }

  // Si ya está autenticado, redirige a su área
  //if (isAuthenticated && user) {
  //  const role = user.profile.role
  //  if (role === 'tourist') return <Navigate to="/app" replace />
  //  if (role === 'churre') return <Navigate to="/churres" replace />
  //  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  //}
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: 'var(--bg)',
      overflowX: 'hidden'
    }}>
      {/* Left Panel - Desktop Only */}
      <div className="auth-left-panel" style={{
        flex: 1,
        background: '#111009',
        borderRight: '1px solid rgba(255,120,30,0.10)',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background particles placeholder */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
          {/* Three.js would go here, using a gradient for now */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,85,0,0.08) 0%, transparent 70%)'
          }} />
        </div>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 2 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '28px',
            letterSpacing: '-1.5px',
            color: 'var(--white)',
          }}>
            burri<span style={{ color: 'var(--orange)' }}>to</span>
          </span>
        </Link>

        {/* Center Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(52px, 5vw, 80px)',
              letterSpacing: '-3px',
              color: 'var(--white)',
              lineHeight: 0.9,
              margin: 0
            }}>
              Piura de<br />verdad.
            </h1>

            <div style={{ width: '36px', height: '4px', background: 'var(--orange)', margin: '32px 0' }} />

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--yellow)', fontWeight: 800 }}>60s</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--gray)' }}>para tu itinerario</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--yellow)', fontWeight: 800 }}>100%</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--gray)' }}>spots locales</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--yellow)', fontWeight: 800 }}>0</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--gray)' }}>guías genéricas</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Testimonial Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            zIndex: 2,
            maxWidth: '340px'
          }}
        >
          <div style={{ color: 'var(--yellow)', fontSize: '14px', marginBottom: '12px' }}>★★★★★</div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--white)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: '0 0 12px 0'
          }}>
            "Llegué sin plan. En 2 minutos tenía mi día armado."
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)', margin: 0 }}>
            María G. · Lima
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
