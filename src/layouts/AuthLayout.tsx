import { Outlet, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'

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
  const location = useLocation()

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

      {/* ── LEFT PANEL (desktop + tablet) ── */}
      <div className="auth-left">
        {BLOBS.map((b, i) => (
          <div key={i} className="auth-blob" style={{
            width: b.size, height: b.size,
            top: (b as any).top, left: (b as any).left,
            bottom: (b as any).bottom, right: (b as any).right,
            opacity: b.opacity,
          }} />
        ))}

        <Link to="/" className="auth-logo-link">
          <img src="/imagotipo.png" alt="Burrito" style={{ height: '42px', width: 'auto' }} />
          <span className="auth-logo-text">burri<span style={{ color: 'var(--orange)' }}>to</span></span>
        </Link>

        <div className="auth-left-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}
            >
              <img src="/imagotipo.png" alt="Burrito" style={{ height: '120px', width: 'auto', filter: 'drop-shadow(0 20px 40px rgba(255,85,0,0.3))' }} />
            </motion.div>

            <h1 className="auth-headline">Piura de<br />verdad.</h1>
            <div style={{ width: '36px', height: '4px', background: 'var(--orange)', margin: '24px 0' }} />

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

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">

        {/* Subtle background glow — decorativo, no distrae */}
        <div className="auth-right-glow" />

        {/* Mobile-only top bar */}
        <div className="auth-mobile-topbar">
          <Link to="/" className="auth-mobile-logo">
            <img src="/imagotipo.png" alt="Burrito" style={{ height: 'auto', width: '40vw' }} />
          </Link>
        </div>

        {/* Centered form — cross-fade when navigating between auth pages */}
        <div className="auth-form-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      <style>{`
        /* ══════════════════════════════
           ROOT
        ══════════════════════════════ */
        .auth-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: row;
          background: var(--bg);
          overflow-x: hidden;
        }

        /* ══════════════════════════════
           LEFT PANEL
        ══════════════════════════════ */
        .auth-left {
          width: 44%;
          max-width: 540px;
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

        /* ══════════════════════════════
           RIGHT PANEL
        ══════════════════════════════ */
        .auth-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          min-height: 100dvh;
          padding: 40px 32px;
          position: relative;
          overflow-x: hidden;
        }
        .auth-right-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,85,0,0.35) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .auth-form-wrapper {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }

        .auth-mobile-logo {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.5px;
          color: var(--white);
        }

        /* ── Auth inputs ── */
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

        /* ══════════════════════════════
           SHARED AUTH SYSTEM
           (Login, Register, ChurreRegister, ForgotPassword)
        ══════════════════════════════ */

        .auth-heading-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .auth-accent-bar {
          width: 3px; height: 28px; border-radius: 100px; flex-shrink: 0;
          background: linear-gradient(to bottom, var(--orange), var(--hot));
        }
        .auth-title {
          font-family: var(--font-display);
          font-size: clamp(26px, 5vw, 34px);
          font-weight: 900;
          color: var(--white);
          margin: 0;
          letter-spacing: -1.2px;
          line-height: 1.1;
        }
        .auth-subtitle {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--muted);
          margin: 8px 0 0;
          padding-left: 13px;
          line-height: 1.5;
        }

        .auth-field { display: flex; flex-direction: column; }
        .auth-field-label {
          display: block;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
          letter-spacing: 0.1px;
        }
        .auth-field-wrap { position: relative; display: flex; align-items: center; }
        .auth-field-icon {
          position: absolute;
          left: 14px;
          color: var(--muted);
          display: flex;
          pointer-events: none;
        }
        .auth-field-right {
          position: absolute;
          right: 14px;
          display: flex;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .auth-back-btn {
          background: none;
          border: none;
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0 0 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s;
        }
        .auth-back-btn:hover { color: var(--white); }

        .auth-google-btn {
          width: 100%;
          height: 54px;
          background: #ffffff;
          border: 1.5px solid #e2e2e2;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          cursor: pointer;
          transition: transform 0.18s var(--ease-smooth), box-shadow 0.18s var(--ease-smooth);
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .auth-google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.14);
        }
        .auth-google-btn:disabled { opacity: 0.75; cursor: not-allowed; }

        .auth-btn-primary {
          width: 100%;
          height: 54px;
          background: var(--orange);
          border: none;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: var(--font-body);
          font-size: 15.5px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: transform 0.18s var(--ease-smooth), box-shadow 0.18s var(--ease-smooth), background 0.18s;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: var(--hot);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }
        .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .auth-btn-ghost {
          width: 100%;
          height: 50px;
          background: transparent;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
        }
        .auth-btn-ghost:hover:not(:disabled) {
          border-color: var(--amber);
          color: var(--white);
          background: var(--border);
        }
        .auth-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-divider { display: flex; align-items: center; gap: 16px; margin: 6px 0; }
        .auth-divider-line { flex: 1; height: 1px; background: var(--border); }
        .auth-divider-text { font-family: var(--font-body); font-size: 12px; color: var(--muted); white-space: nowrap; }

        .auth-error-banner {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px;
          padding: 10px 14px;
          color: #ef4444;
          font-size: 13px;
          font-family: var(--font-body);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-legal {
          font-family: var(--font-body);
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          line-height: 1.6;
        }
        .auth-link { color: var(--orange); cursor: pointer; text-decoration: none; }
        .auth-link-muted { color: var(--white); opacity: 0.7; text-decoration: none; font-weight: 600; }
        .auth-link-muted:hover { opacity: 1; }

        .auth-role-card {
          --role-color: var(--orange);
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          text-align: left;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s;
          position: relative;
          overflow: hidden;
        }
        .auth-role-card:hover, .auth-role-card:focus-visible {
          border-color: var(--role-color);
          background: color-mix(in srgb, var(--role-color) 6%, transparent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--role-color) 12%, transparent);
        }
        .auth-role-card:active { transform: translateY(0) scale(0.99); }
        .auth-role-card:focus-visible { outline: 2px solid var(--role-color); outline-offset: 2px; }
        .auth-role-card-bar {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: var(--role-color);
          opacity: 0.6;
        }
        .auth-role-card-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--role-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--role-color) 22%, transparent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--role-color);
        }

        .auth-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px 4px 7px;
          background: color-mix(in srgb, var(--role-color) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--role-color) 25%, transparent);
          border-radius: 100px;
          color: var(--role-color);
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        button:focus-visible, a:focus-visible {
          outline: 2px solid var(--orange);
          outline-offset: 2px;
        }

        /* ══════════════════════════════
           TABLET  901–1100px
        ══════════════════════════════ */
        @media (max-width: 1100px) and (min-width: 901px) {
          .auth-left {
            width: 40%;
            padding: 40px 36px 36px;
          }
          .auth-headline {
            font-size: clamp(36px, 3.8vw, 54px);
          }
        }

        /* ══════════════════════════════
           MOBILE  ≤ 900px
        ══════════════════════════════ */
        @media (max-width: 900px) {
          .auth-left { display: none; }

          .auth-mobile-topbar {
            display: flex;
            position: relative;
            top: -7vh;
            
          }

          .auth-right {
            justify-content: center;
            padding: 80px 24px 40px; /* 80px top = topbar height */
          }
          .auth-form-wrapper {
            max-width: 440px;
            width: 100%;
          }
        }

        /* ══════════════════════════════
           SMALL MOBILE  ≤ 480px
        ══════════════════════════════ */
        @media (max-width: 480px) {
          .auth-right {
            padding: 72px 16px 32px;
          }
          .auth-form-wrapper {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
