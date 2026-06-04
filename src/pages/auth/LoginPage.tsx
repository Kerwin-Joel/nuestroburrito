import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Loader2, ShieldCheck, Zap, MapPin, Users } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole } from '../../types/auth'

const ROLES: { role: UserRole; icon: ReactNode; title: string; sub: string; color: string }[] = [
  {
    role: 'tourist',
    icon: <span style={{ fontSize: '28px', lineHeight: 1 }}>🏇</span>,
    title: 'Turista',
    sub: 'Explora Piura como local',
    color: '#FF5500',
  },
  {
    role: 'churre',
    icon: <span style={{ fontSize: '28px', lineHeight: 1 }}>🤝</span>,
    title: 'Churre',
    sub: 'Panel de guía local',
    color: '#7c3aed',
  }
]

// SVG oficial de Google
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

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
        {!selectedRole ? (
          /* ── ROLE SELECTOR ── */
          <motion.div
            key="role-selector"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
          >

            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
              color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '6px',
            }}>
              Bienvenido a Burrito
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 5vw, 32px)',
              fontWeight: 900, color: 'var(--white)', margin: '0 0 8px', letterSpacing: '-1px',
            }}>
              ¿Cómo quieres entrar?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '28px' }}>
              Selecciona tu rol para continuar
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ROLES.map(({ role, icon, title, sub, color }, i) => (
                <motion.button
                  key={role}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(role)}
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '18px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.22s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color
                    e.currentTarget.style.background = `${color}08`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--card)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: `${color}12`, border: `1px solid ${color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--white)', letterSpacing: '-0.3px' }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                      {sub}
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--muted)" />
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              margin: '24px 0 0',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                acceso seguro
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Security badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', marginTop: '12px',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: '12px',
            }}>
              <ShieldCheck size={14} color="#10b981" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                Protegido con Google OAuth 2.0 · Sin contraseñas
              </span>
            </div>
          </motion.div>
        ) : (
          /* ── GOOGLE LOGIN ── */
          <motion.div
            key="google-login"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}
          >
            {/* Back button */}
            <button
              onClick={() => { setSelectedRole(null); clearError() }}
              style={{
                background: 'none', border: 'none', color: 'var(--orange)',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', padding: 0, marginBottom: '28px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              ← Cambiar rol
            </button>

            {/* Role badge */}
            {activeRole && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '5px 12px 5px 8px',
                background: `${activeRole.color}12`, border: `1px solid ${activeRole.color}30`,
                borderRadius: '20px', marginBottom: '16px',
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{activeRole.icon}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: activeRole.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {activeRole.title}
                </span>
              </div>
            )}

            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 900, color: 'var(--white)', margin: '0 0 6px', letterSpacing: '-0.8px',
            }}>
              {selectedRole === 'tourist' && 'Bienvenido de vuelta'}
              {selectedRole === 'churre' && 'Hola, Churre 🤝'}
              {selectedRole === 'admin' && 'Acceso Admin 🔐'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '36px' }}>
              {selectedRole === 'tourist' && 'Inicia sesión con tu cuenta de Google para explorar Piura'}
              {selectedRole === 'churre' && 'Accede a tu panel de guía local con Google'}
              {selectedRole === 'admin' && 'Acceso exclusivo para el equipo de Burrito'}
            </p>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '12px', padding: '10px 14px', color: '#ef4444',
                    fontSize: '13px', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={isGoogleLoading}
              onClick={handleGoogleLogin}
              style={{
                width: '100%', height: '56px',
                background: '#fff',
                border: '1.5px solid #e5e7eb',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: '#111',
                cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isGoogleLoading ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={e => {
                if (!isGoogleLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              {isGoogleLoading ? (
                <Loader2 size={20} className="animate-spin" style={{ color: '#666' }} />
              ) : (
                <GoogleIcon />
              )}
              {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
            </motion.button>

            {/* Security badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              marginTop: '14px',
            }}>
              <ShieldCheck size={13} color="var(--muted)" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
                Cifrado SSL · Sin contraseñas almacenadas
              </span>
            </div>

            {/* Info text */}
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '12px',
              color: 'var(--muted)', textAlign: 'center', marginTop: '16px', lineHeight: 1.6,
            }}>
              Al continuar aceptas nuestros{' '}
              <span style={{ color: 'var(--orange)', cursor: 'pointer' }}>Términos de servicio</span>
              {' '}y{' '}
              <span style={{ color: 'var(--orange)', cursor: 'pointer' }}>Política de privacidad</span>
            </p>

            {/* Register link for non-admin */}
            {selectedRole !== 'admin' && (
              <div style={{
                marginTop: '24px',
                padding: '14px 16px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5 }}>
                  🚀 ¿Primera vez? Simplemente inicia sesión con Google y te registramos automáticamente
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
