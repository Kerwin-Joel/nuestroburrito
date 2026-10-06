import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { AuthHeading, FieldInput, ErrorBanner, authStepMotion } from '../../components/auth/AuthUI'

/**
 * Mismo registro que la app nativa: nombre, correo y contraseña — sin
 * confirmar contraseña, sin Google (ver ui/auth/RegisterScreen.kt). La
 * validación también es la misma: mínimo 6 caracteres, con un check en
 * vivo en vez de esperar a que falle el envío.
 */
export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(2)
  const { registerTourist, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const passwordOk = password.length >= 6
  const canSubmit = name.trim() !== '' && email.trim() !== '' && passwordOk && !isLoading

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    try {
      await registerTourist({ name: name.trim(), email: email.trim(), password })
      setIsSuccess(true)
    } catch {
      // Error handled by store
    }
  }

  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000)
      return () => clearInterval(timer)
    } else if (isSuccess && countdown === 0) {
      navigate('/app')
    }
  }, [isSuccess, countdown, navigate])

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div key="register-form" {...authStepMotion}>
            <AuthHeading title="Crea tu cuenta" subtitle="Es gratis, y en menos de un minuto estás listo para armar tu primer día en Piura." />

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FieldInput
                label="Nombre"
                icon={<User size={18} />}
                value={name}
                onChange={e => { setName(e.target.value); if (error) clearError() }}
                placeholder="¿Cómo te llamas?"
              />

              <FieldInput
                label="Correo"
                icon={<Mail size={18} />}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) clearError() }}
                placeholder="tu@email.com"
              />

              <div className="auth-field">
                <FieldInput
                  label="Contraseña"
                  icon={<Lock size={18} />}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (error) clearError() }}
                  placeholder="Tu contraseña"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-field-right"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                {/* Se confirma en vivo, no recién al fallar el envío. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingLeft: '4px' }}>
                  {passwordOk ? <CheckCircle2 size={14} color="#22c55e" /> : <Circle size={14} color="var(--muted)" />}
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: passwordOk ? '#22c55e' : 'var(--muted)' }}>
                    Mínimo 6 caracteres
                  </span>
                </div>
              </div>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <button type="submit" disabled={!canSubmit} className="auth-btn-primary" style={{ marginTop: '4px' }}>
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creando tu cuenta...
                  </>
                ) : (
                  <>Crear cuenta <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div style={{ marginTop: '28px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '14px' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="auth-link" style={{ fontWeight: 600 }}>
                  Inicia sesión →
                </Link>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 16, stiffness: 220 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              border: '2px solid #22c55e'
            }}>
              <CheckCircle2 size={40} color="#22c55e" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 900, color: 'var(--white)', margin: '0 0 12px 0', letterSpacing: '-1px' }}>
              ¡Cuenta creada! 🎉
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '15px', marginBottom: '32px' }}>
              Bienvenido/a a Burrito. Serás redirigido en unos segundos.
            </p>

            <div style={{ width: '100%', height: '4px', background: 'var(--dim)', borderRadius: '2px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 2, ease: 'linear' }}
                style={{ height: '100%', background: 'var(--orange)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
