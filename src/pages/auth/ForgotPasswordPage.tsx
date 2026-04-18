import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'

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
    } catch (err) {
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
          <motion.div
            key="forgot-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '32px', 
              fontWeight: 800, 
              color: 'var(--white)',
              margin: '0 0 8px 0'
            }}>
              Recupera tu acceso
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.5 }}>
              Te enviaremos las instrucciones a tu email para restablecer tu contraseña.
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

              {error && <div className="error-banner">❌ {error}</div>}

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', height: '52px', fontSize: '16px', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '10px' }} />
                    Enviando...
                  </>
                ) : (
                  <>Enviar instrucciones <ArrowRight size={18} style={{ marginLeft: '10px' }} /></>
                )}
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '14px', marginBottom: '12px' }}>
                ¿Recuerdas tu contraseña?
              </p>
              <Link to="/login" style={{ fontFamily: 'var(--font-body)', color: 'var(--white)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', opacity: 0.7 }}>
                ← Volver al login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-forgot"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📧</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--white)', margin: '0 0 16px 0' }}>
              Revisa tu email
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '15px', marginBottom: '12px', lineHeight: 1.5 }}>
              Enviamos las instrucciones a:
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--amber)', fontWeight: 700, marginBottom: '24px' }}>
              {getValues('email')}
            </p>
            
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '13px', marginBottom: '32px' }}>
              Si no ves el email en unos minutos, revisa tu carpeta de spam.
            </p>

            <button
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="btn btn-ghost"
              style={{ width: '100%', marginBottom: '16px' }}
            >
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar instrucciones →'}
            </button>

            <Link to="/login" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              ← Volver al login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

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
        .auth-input:focus { outline: none; border-color: var(--orange); box-shadow: 0 0 0 2px rgba(255,85,0,0.1); }
        .error-msg { color: #ef4444; font-size: 12px; margin-top: 6px; font-family: var(--font-body); }
        .error-banner { background: rgba(255,85,0,0.08); border: 1px solid rgba(255,85,0,0.3); border-radius: 12px; padding: 12px 16px; color: var(--orange); font-size: 14px; margin-bottom: 12px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
