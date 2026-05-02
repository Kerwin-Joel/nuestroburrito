import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { motion } from 'framer-motion'

const STATS = [
  { value: '60s', label: 'para tu itinerario' },
  { value: '100%', label: 'spots locales' },
  { value: '0', label: 'guías genéricas' },
]

const BLOBS = [
  { size: 320, top: '-80px', left: '-80px', opacity: 0.07 },
  { size: 220, bottom: '60px', right: '-60px', opacity: 0.06 },
  { size: 140, top: '40%', left: '55%', opacity: 0.05 },
]

export default function AuthLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (!isLoading && isAuthenticated && user) {
    const role = user.profile.role
    if (role === 'tourist') return <Navigate to="/app" replace />
    if (role === 'churre') {
      if (user.profile.status === 'pending') return <Navigate to="/waiting-approval" replace />
      return <Navigate to="/churres" replace />
    }
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="auth-root">
      {/* ── LEFT PANEL (desktop) ── */}
      <div className="auth-left">
        {/* Blobs decorativos */}
        {BLOBS.map((b, i) => (
          <div key={i} className="auth-blob" style={{
            width: b.size, height: b.size,
            top: (b as any).top, left: (b as any).left,
            bottom: (b as any).bottom, right: (b as any).right,
            opacity: b.opacity,
          }} />
        ))}

        {/* Logo */}
        <Link to="/" className="auth-logo-link">
          <img src="/imagotipo.png" alt="Burrito" style={{ height: '42px', width: 'auto' }} />
          <span className="auth-logo-text">burri<span style={{ color: 'var(--orange)' }}>to</span></span>
        </Link>

        {/* Hero content */}
        <div className="auth-left-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Burrito visual */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}
            >
              <img src="/imagotipo.png" alt="Burrito" style={{ height: '120px', width: 'auto', filter: 'drop-shadow(0 20px 40px rgba(255,85,0,0.3))' }} />
            </motion.div>

            <h1 className="auth-headline">
              Piura de<br />verdad.
            </h1>
            <div style={{ width: '36px', height: '4px', background: 'var(--orange)', margin: '28px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {STATS.map(({ value, label }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <span className="auth-stat-value">{value}</span>
                  <span className="auth-stat-label">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="auth-testimonial"
        >
          <div style={{ color: 'var(--amber)', fontSize: '13px', marginBottom: '10px', letterSpacing: '2px' }}>★★★★★</div>
          <p className="auth-testimonial-text">"Llegué sin plan. En 2 minutos tenía mi día armado."</p>
          <p className="auth-testimonial-author">María G. · Lima</p>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="auth-right">
        {/* Mobile header */}
        <div className="auth-mobile-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/imagotipo.png" alt="Burrito" style={{ height: '32px', width: 'auto' }} />
            <span className="auth-logo-text" style={{ fontSize: '22px' }}>burri<span style={{ color: 'var(--orange)' }}>to</span></span>
          </Link>
        </div>

        {/* Decoration ring (mobile) */}
        <div className="auth-mobile-ring" />

        <div className="auth-form-wrapper">
          <Outlet />
        </div>
      </div>

      <style>{`
        /* ── Root layout ── */
        .auth-root {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background: var(--bg);
          overflow-x: hidden;
          position: relative;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          width: 44%;
          max-width: 560px;
          flex-shrink: 0;
          background: var(--card);
          border-right: 1px solid var(--border);
          padding: 52px 52px 44px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .auth-blob {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, var(--orange), transparent 70%);
          pointer-events: none;
        }
        .auth-logo-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }
        .auth-logo-text {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -1px;
          color: var(--white);
        }
        .auth-left-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
          padding: 32px 0;
        }
        .auth-headline {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(44px, 4.5vw, 72px);
          letter-spacing: -3px;
          color: var(--white);
          line-height: 0.92;
          margin: 0;
        }
        .auth-stat-value {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          color: var(--orange);
          min-width: 56px;
        }
        .auth-stat-label {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--muted);
        }
        .auth-testimonial {
          background: var(--card2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px 22px;
          position: relative;
          z-index: 2;
          max-width: 320px;
        }
        .auth-testimonial-text {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--white);
          font-style: italic;
          line-height: 1.55;
          margin: 0 0 10px 0;
        }
        .auth-testimonial-author {
          font-family: var(--font-body);
          font-size: 11px;
          color: var(--muted);
          margin: 0;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px 60px;
          position: relative;
          overflow-y: auto;
          min-height: 100vh;
        }
        .auth-mobile-header {
          display: none;
          width: 100%;
          max-width: 420px;
          padding-bottom: 28px;
        }
        .auth-mobile-ring {
          display: none;
          position: absolute;
          top: -100px;
          right: -100px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          border: 1px solid rgba(255,85,0,0.12);
          pointer-events: none;
        }
        .auth-form-wrapper {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 2;
        }

        /* ── Auth inputs (theme-aware) ── */
        .auth-input {
          width: 100%;
          background: var(--card2);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          height: 50px;
          padding: 0 16px 0 46px;
          color: var(--white);
          font-family: var(--font-body);
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: var(--muted); }
        .auth-input:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(255,85,0,0.1);
        }
        .error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
          font-family: var(--font-body);
        }
        .animate-spin {
          animation: auth-spin 1s linear infinite;
        }
        @keyframes auth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .auth-left { display: none; }
          .auth-mobile-header { display: flex; }
          .auth-mobile-ring { display: block; }
          .auth-right {
            justify-content: flex-start;
            padding-top: 32px;
          }
        }
        @media (max-width: 480px) {
          .auth-right { padding: 24px 16px 80px; }
          .auth-form-wrapper { max-width: 100%; }
        }
      `}</style>
    </div>
  )
}
