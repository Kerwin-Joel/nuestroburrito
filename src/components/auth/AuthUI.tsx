import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

/** Curva y duración únicas para todas las transiciones de los pasos de auth. */
export const AUTH_TRANSITION = { duration: 0.26, ease: [0.4, 0, 0.2, 1] as const }
export const authStepMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: AUTH_TRANSITION,
}

export const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

/** Título con la barra de acento naranja + subtítulo, usado por todas las pantallas de auth. */
export function AuthHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div style={{ marginBottom: subtitle ? '28px' : '20px' }}>
      <div className="auth-heading-row">
        <div className="auth-accent-bar" />
        <h2 className="auth-title">{title}</h2>
      </div>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
    </div>
  )
}

export function BackButton({ onClick, label = 'Volver' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="auth-back-btn">
      <ArrowLeft size={14} strokeWidth={2.5} /> {label}
    </button>
  )
}

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: ReactNode
  error?: string
  rightSlot?: ReactNode
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  ({ label, icon, error, rightSlot, ...props }, ref) => (
    <div className="auth-field">
      <label className="auth-field-label">{label}</label>
      <div className="auth-field-wrap">
        <span className="auth-field-icon">{icon}</span>
        <input ref={ref} className="auth-input" {...props} />
        {rightSlot}
      </div>
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
)
FieldInput.displayName = 'FieldInput'

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="auth-error-banner"
      >
        ⚠️ {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function Divider({ text }: { text: string }) {
  return (
    <div className="auth-divider">
      <div className="auth-divider-line" />
      <span className="auth-divider-text">{text}</span>
      <div className="auth-divider-line" />
    </div>
  )
}

/** Indicador de pasos por puntos (usado en Login). */
export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '28px' }}>
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <motion.div
          key={n}
          animate={{
            width: step === n ? 20 : 6,
            background: step === n ? 'var(--orange)' : 'var(--border)',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '6px', borderRadius: '100px' }}
        />
      ))}
    </div>
  )
}
