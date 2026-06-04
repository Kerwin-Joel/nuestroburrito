import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Loader2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole } from '../../types/auth'

const ROLES: {
  role: UserRole
  icon: ReactNode
  title: string
  sub: string
  color: string
}[] = [
  {
    role: 'tourist',
    icon: <span style={{ fontSize: '26px', lineHeight: 1 }}>🏇</span>,
    title: 'Turista',
    sub: 'Quiero explorar Piura',
    color: '#FF5500',
  },
  {
    role: 'churre',
    icon: <span style={{ fontSize: '26px', lineHeight: 1 }}>🤝</span>,
    title: 'Churre',
    sub: 'Soy guía local',
    color: '#7c3aed',
  },
]

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

/** Indicador de paso: 2 puntos / líneas */
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '28px' }}>
      {[1, 2].map(n => (
        <motion.div
          key={n}
          animate={{
            width: step === n ? 20 : 6,
            background: step === n ? 'var(--orange)' : 'var(--border)',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '6px',
            borderRadius: '100px',
          }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { loginWithGoogle, error, clearError } = useAuthStore()

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch {
      setIsGoogleLoading(false)
    }
  }

  const activeRole = ROLES.find(r => r.role === selectedRole)

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">

        {/* ─────────────────────────────────────────
            PASO 1 — Selección de rol
        ───────────────────────────────────────── */}
        {!selectedRole && (
          <motion.div
            key="step-role"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          >
            <StepDots step={1} />

            {/* Acento naranja + título */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <div style={{
                  width: '3px',
                  height: '28px',
                  borderRadius: '100px',
                  background: 'linear-gradient(to bottom, var(--orange), var(--hot))',
                  flexShrink: 0,
                }} />
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(26px, 5vw, 34px)',
                  fontWeight: 900,
                  color: 'var(--white)',
                  margin: 0,
                  letterSpacing: '-1.2px',
                  lineHeight: 1.1,
                }}>
                  ¿Cómo entras?
                </h2>
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--muted)',
                margin: 0,
                paddingLeft: '13px',
                lineHeight: 1.5,
              }}>
                Elige tu perfil y entra en segundos.
              </p>
            </div>

            {/* Role cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {ROLES.map(({ role, icon, title, sub, color }, i) => (
                <motion.button
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.22 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedRole(role)}
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color
                    e.currentTarget.style.background = `${color}0a`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${color}1a`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--card)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Barra de color izquierda — detalle sutil */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3px',
                    borderRadius: '0 4px 4px 0',
                    background: color,
                    opacity: 0.6,
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${color}12`,
                    border: `1px solid ${color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: 'var(--white)',
                      letterSpacing: '-0.2px',
                    }}>
                      {title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--muted)',
                      marginTop: '2px',
                    }}>
                      {sub}
                    </div>
                  </div>

                  <ChevronRight size={16} color="var(--muted)" strokeWidth={2.5} />
                </motion.button>
              ))}
            </div>

            {/* Trust signal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}>
              <ShieldCheck size={13} color="var(--muted)" strokeWidth={2} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--muted)',
              }}>
                Sin contraseñas · Google OAuth 2.0
              </span>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────
            PASO 2 — Login con Google
        ───────────────────────────────────────── */}
        {selectedRole && (
          <motion.div
            key="step-google"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          >
            <StepDots step={2} />

            {/* Back */}
            <button
              onClick={() => { setSelectedRole(null); clearError() }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0 0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
            >
              ← Volver
            </button>

            {/* Rol seleccionado — contexto pequeño */}
            {activeRole && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '4px 10px 4px 7px',
                background: `${activeRole.color}10`,
                border: `1px solid ${activeRole.color}25`,
                borderRadius: '100px',
                marginBottom: '20px',
              }}>
                <span style={{ fontSize: '15px', lineHeight: 1 }}>{activeRole.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: activeRole.color,
                  letterSpacing: '0.2px',
                }}>
                  {activeRole.title}
                </span>
              </div>
            )}

            {/* Titular + acento */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}>
              <div style={{
                width: '3px',
                height: '28px',
                borderRadius: '100px',
                background: 'linear-gradient(to bottom, var(--orange), var(--hot))',
                flexShrink: 0,
              }} />
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 5vw, 30px)',
                fontWeight: 900,
                color: 'var(--white)',
                margin: 0,
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}>
                {selectedRole === 'tourist' && 'Bienvenido'}
                {selectedRole === 'churre' && 'Hola, Churre'}
                {selectedRole === 'admin' && 'Acceso admin'}
              </h2>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--muted)',
              margin: '0 0 32px',
              paddingLeft: '13px',
              lineHeight: 1.5,
            }}>
              {selectedRole === 'tourist' && 'Entra con Google y empieza a explorar Piura.'}
              {selectedRole === 'churre' && 'Accede a tu panel de guía con un clic.'}
              {selectedRole === 'admin' && 'Acceso exclusivo para el equipo Burrito.'}
            </p>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google CTA */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.975 }}
              disabled={isGoogleLoading}
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: '54px',
                background: isGoogleLoading ? '#f5f5f5' : '#ffffff',
                border: '1.5px solid #e2e2e2',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a1a',
                cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.18s, box-shadow 0.18s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                opacity: isGoogleLoading ? 0.75 : 1,
              }}
              onMouseEnter={e => {
                if (!isGoogleLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'
              }}
            >
              {isGoogleLoading
                ? <Loader2 size={18} className="animate-spin" style={{ color: '#999' }} />
                : <GoogleIcon />
              }
              {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
            </motion.button>

            {/* Texto legal */}
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'var(--muted)',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.6,
            }}>
              Al entrar aceptas los{' '}
              <span style={{ color: 'var(--orange)', cursor: 'pointer' }}>Términos</span>
              {' '}y la{' '}
              <span style={{ color: 'var(--orange)', cursor: 'pointer' }}>Política de privacidad</span>
            </p>

            {/* Nota de registro */}
            {selectedRole !== 'admin' && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--muted)',
                textAlign: 'center',
                marginTop: '10px',
                lineHeight: 1.5,
              }}>
                ¿Primera vez? Te registramos automáticamente.
              </p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
