import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { AuthHeading, FieldInput, ErrorBanner, authStepMotion } from '../../components/auth/AuthUI'

/**
 * Mismo login que la app nativa: correo + contraseña, sin selector de rol
 * ni Google — "Bienvenido / Ingresa para seguir explorando Piura" y
 * "Entrar" (ver ui/auth/LoginScreen.kt). El rol de la cuenta ya está en su
 * perfil; no hace falta que la persona lo elija cada vez que entra.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const canSubmit = email.trim() !== '' && password !== '' && !isLoading

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    try {
      const role = await login({ email: email.trim(), password })
      navigate(role === 'churre' ? '/churres' : role === 'admin' ? '/admin' : '/app')
    } catch {
      // El error ya queda en el store y se muestra abajo.
    }
  }

  return (
    <motion.div key="login-form" {...authStepMotion} style={{ width: '100%' }}>
      <AuthHeading title="Bienvenido" subtitle="Ingresa para seguir explorando Piura." />

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
        </div>

        <Link to="/forgot-password" className="auth-link" style={{ alignSelf: 'flex-end', fontSize: '13px', marginTop: '-8px' }}>
          ¿Olvidaste tu contraseña?
        </Link>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <button type="submit" disabled={!canSubmit} className="auth-btn-primary" style={{ marginTop: '4px' }}>
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Entrando...
            </>
          ) : (
            <>Entrar <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div style={{ marginTop: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '14px' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link" style={{ fontWeight: 600 }}>
            Regístrate →
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
