import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserRole, LoginCredentials } from '../../types/auth'
import gsap from 'gsap'

const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

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
      console.log('ROL RECIBIDO:', role)
      if (role === 'tourist') navigate('/app')
      else if (role === 'churre') navigate('/churres')
      else if (role === 'admin') navigate('/admin/dashboard')
    } catch (err) {
      // Error is handled by store
    }
  }

  const fillCredentials = (role: UserRole, email: string, pass: string) => {
    setSelectedRole(role)
    setValue('email', email)
    setValue('password', pass)
  }

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div
            key="role-selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              color: 'var(--orange)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '24px'
            }}>
              ¿CÓMO QUIERES ENTRAR?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <RoleCard
                icon="🌯"
                title="Turista"
                sub="Explora Piura"
                onClick={() => setSelectedRole('tourist')}
                index={0}
              />
              <RoleCard
                icon="🤝"
                title="Churre"
                sub="Guía local"
                onClick={() => setSelectedRole('churre')}
                index={1}
              />
              <RoleCard
                icon="🔐"
                title="Admin"
                sub="Panel admin"
                onClick={() => setSelectedRole('admin')}
                index={2}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => { setSelectedRole(null); clearError(); }}
              style={{
                background: 'none', border: 'none', color: 'var(--amber)',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', padding: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              ← Cambiar rol
            </button>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--white)',
              margin: '0 0 8px 0'
            }}>
              {selectedRole === 'tourist' && "Bienvenido de vuelta 🌯"}
              {selectedRole === 'churre' && "Hola, Churre 🤝"}
              {selectedRole === 'admin' && "Acceso admin 🔐"}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '15px', marginBottom: '32px' }}>
              {selectedRole === 'tourist' && "¿Listo para explorar Piura?"}
              {selectedRole === 'churre' && "Accede a tu panel de guía"}
              {selectedRole === 'admin' && "Panel de administración Burrito"}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginBottom: '8px', fontWeight: 600 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="tu@email.com"
                    className="auth-input"
                  />
                </div>
                {errors.email && <p className="error-msg">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', fontWeight: 600 }}>
                    Contraseña
                  </label>
                  <Link to="/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--amber)', textDecoration: 'none' }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                  <input
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="error-msg">{errors.password.message}</p>}
              </div>

              {error && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  style={{
                    background: 'rgba(255,85,0,0.08)',
                    border: '1px solid rgba(255,85,0,0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'var(--orange)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  ❌ {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', height: '52px', fontSize: '16px', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '10px' }} />
                    Ingresando...
                  </>
                ) : (
                  <>Iniciar sesión <ArrowRight size={18} style={{ marginLeft: '10px' }} /></>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)' }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                style={{
                  width: '100%', height: '52px', background: 'white', border: 'none', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: '#000',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                Google
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              {selectedRole !== 'admin' ? (
                <>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '14px', marginBottom: '12px' }}>
                    ¿No tienes cuenta?
                  </p>
                  <Link
                    to={selectedRole === 'tourist' ? "/register" : "/register/churre"}
                    className="btn btn-ghost"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    Crear cuenta
                  </Link>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '13px' }}>
                  Contacta al equipo de Burrito si necesitas acceso
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev Credentials Helper */}
      <div style={{ marginTop: '48px', padding: '16px', borderRadius: '14px', border: '1px dashed rgba(255,170,59,0.2)', background: 'rgba(255,170,59,0.03)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          🧪 Credenciales de prueba
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <DevRow role="TURISTA" email="turista@burrito.pe" pass="turista123" onClick={() => fillCredentials('tourist', 'turista@burrito.pe', 'turista123')} />
          <DevRow role="CHURRE" email="churre@burrito.pe" pass="churre123" onClick={() => fillCredentials('churre', 'churre@burrito.pe', 'churre123')} />
          <DevRow role="ADMIN" email="admin@burrito.pe" pass="admin123" onClick={() => fillCredentials('admin', 'admin@burrito.pe', 'admin123')} />
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background: #111009;
          border: 1px solid var(--border);
          border-radius: 12px;
          height: 48px;
          padding: 0 16px 0 46px;
          color: white;
          font-family: var(--font-body);
          font-size: 15px;
          transition: all 0.3s;
        }
        .auth-input:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 2px rgba(255,85,0,0.1);
        }
        .error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
          font-family: var(--font-body);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function RoleCard({ icon, title, sub, onClick, index }: { icon: string, title: string, sub: string, onClick: () => void, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.3s'
      }}
      className="role-card"
    >
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>{title}</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)', margin: '2px 0 0 0' }}>{sub}</p>
      </div>
      <style>{`
        .role-card:hover {
          transform: translateY(-4px);
          border-color: var(--orange);
          background: rgba(255,85,0,0.04);
        }
      `}</style>
    </motion.div>
  )
}

function DevRow({ role, email, pass, onClick }: { role: string, email: string, pass: string, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      className="dev-row"
    >
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
        background: 'rgba(255,85,0,0.15)', color: 'var(--orange)', padding: '2px 6px', borderRadius: '4px'
      }}>
        {role}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
        {email} · {pass}
      </span>
      <style>{`
        .dev-row:hover { background: rgba(255,170,59,0.05); }
      `}</style>
    </div>
  )
}
