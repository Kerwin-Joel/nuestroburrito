import { useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole, LoginCredentials } from '../../types/auth'

const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const ROLES: { role: UserRole; icon: ReactNode; title: string; sub: string; color: string }[] = [
  {
    role: 'tourist',
    icon: <img src="/imagotipo.png" alt="burrito" style={{ height: '34px', width: 'auto', display: 'block' }} />,
    title: 'Turista',
    sub: 'Explora Piura como local',
    color: 'var(--orange)',
  },
  {
    role: 'churre',
    icon: <span style={{ fontSize: '28px', lineHeight: 1 }}>🤝</span>,
    title: 'Churre',
    sub: 'Panel de guía local',
    color: '#7c3aed',
  },
  {
    role: 'admin',
    icon: <span style={{ fontSize: '28px', lineHeight: 1 }}>🔐</span>,
    title: 'Admin',
    sub: 'Administración Burrito',
    color: '#0ea5e9',
  },
]

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { login, loginWithGoogle, error, clearError, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const role = await login(data)
      if (role === 'tourist') navigate('/app')
      else if (role === 'churre') navigate('/churres')
      else if (role === 'admin') navigate('/admin/dashboard')
    } catch {
      // Error handled by store
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
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: 900, color: 'var(--white)', margin: '0 0 8px', letterSpacing: '-1px',
            }}>
              ¿Cómo quieres entrar?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '32px' }}>
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
                    padding: '18px 20px',
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
          </motion.div>
        ) : (
          /* ── LOGIN FORM ── */
          <motion.div
            key="login-form"
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
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 30px)',
              fontWeight: 900, color: 'var(--white)', margin: '0 0 6px', letterSpacing: '-0.8px',
            }}>
              {selectedRole === 'tourist' && 'Bienvenido de vuelta'}
              {selectedRole === 'churre' && 'Hola, Churre 🤝'}
              {selectedRole === 'admin' && 'Acceso Admin 🔐'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '28px' }}>
              {selectedRole === 'tourist' && '¿Listo para explorar Piura?'}
              {selectedRole === 'churre' && 'Accede a tu panel de guía local'}
              {selectedRole === 'admin' && 'Panel de administración Burrito'}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--white)', marginBottom: '7px' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                  <input {...register('email')} type="email" placeholder="tu@email.com" className="auth-input" />
                </div>
                {errors.email && <p className="error-msg">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--white)' }}>
                    Contraseña
                  </label>
                  <Link to="/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--orange)', textDecoration: 'none' }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="auth-input" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="error-msg">{errors.password.message}</p>}
              </div>

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
                    }}
                  >
                    ❌ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary"
                style={{ width: '100%', height: '50px', fontSize: '15px', justifyContent: 'center', borderRadius: '14px', marginTop: '4px' }}
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> Ingresando...</>
                ) : (
                  <>Iniciar sesión <ArrowRight size={16} style={{ marginLeft: '8px' }} /></>
                )}
              </motion.button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Google */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithGoogle()}
                style={{
                  width: '100%', height: '50px', background: '#fff', border: '1.5px solid #e5e7eb',
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#111',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '16px', height: '16px' }} />
                Continuar con Google
              </motion.button>
            </form>

            {/* Register link */}
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              {selectedRole !== 'admin' ? (
                <>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '13px', marginBottom: '10px' }}>
                    ¿No tienes cuenta?
                  </p>
                  <Link
                    to={selectedRole === 'tourist' ? '/register' : '/register/churre'}
                    className="btn btn-ghost"
                    style={{ width: '100%', padding: '11px', borderRadius: '14px' }}
                  >
                    Crear cuenta gratis
                  </Link>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '13px' }}>
                  Contacta al equipo de Burrito para acceso admin
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function _DevRow({ role, email, pass, onClick }: { role: string; email: string; pass: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, background: 'rgba(255,85,0,0.15)', color: 'var(--orange)', padding: '2px 6px', borderRadius: '4px' }}>
        {role}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{email} · {pass}</span>
    </div>
  )
}
