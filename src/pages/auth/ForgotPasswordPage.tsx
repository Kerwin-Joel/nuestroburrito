import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowRight, MailCheck } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { AuthHeading, FieldInput, ErrorBanner, authStepMotion } from '../../components/auth/AuthUI'

const schema = z.object({
  email: z.string().email('Email no válido'),
})

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const { resetPassword, isLoading, error } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: { email: string }) => {
    try {
      await resetPassword(data.email)
      setSubmitted(true)
      setCooldown(60)
    } catch {
      // Error handled by store
    }
  }

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const handleResend = () => {
    if (cooldown === 0) {
      onSubmit({ email: getValues('email') })
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="forgot-form" {...authStepMotion}>
            <AuthHeading
              title="Recupera tu acceso"
              subtitle="Te enviaremos las instrucciones a tu email para restablecer tu contraseña."
            />

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FieldInput
                label="Email"
                icon={<Mail size={18} />}
                type="email"
                {...register('email')}
                placeholder="tu@email.com"
                error={errors.email?.message}
              />

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <button type="submit" disabled={isLoading} className="auth-btn-primary">
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>Enviar instrucciones <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>
                ¿Recuerdas tu contraseña?
              </p>
              <Link to="/login" className="auth-link-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                ← Volver al login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-forgot"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,170,59,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              color: 'var(--amber)',
            }}>
              <MailCheck size={32} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 900, color: 'var(--white)', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
              Revisa tu email
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '15px', marginBottom: '12px', lineHeight: 1.5 }}>
              Enviamos las instrucciones a:
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--amber)', fontWeight: 700, marginBottom: '24px' }}>
              {getValues('email')}
            </p>

            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '13px', marginBottom: '32px' }}>
              Si no ves el email en unos minutos, revisa tu carpeta de spam.
            </p>

            <button
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="auth-btn-ghost"
              style={{ marginBottom: '16px' }}
            >
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar instrucciones →'}
            </button>

            <Link to="/login" className="auth-link-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              ← Volver al login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
