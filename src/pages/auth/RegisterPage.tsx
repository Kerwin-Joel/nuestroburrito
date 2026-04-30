import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { RegisterTouristData } from '../../types/auth'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email no válido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type FormFields = RegisterTouristData & { confirmPassword: string }

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(2)
  const { registerTourist, loginWithGoogle, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormFields>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password')

  const onSubmit = async (data: FormFields) => {
    try {
      await registerTourist({
        name: data.name,
        email: data.email,
        password: data.password
      })
      setIsSuccess(true)
    } catch (err) {
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
          <motion.div
            key="register-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '32px', 
              fontWeight: 800, 
              color: 'var(--white)',
              margin: '0 0 8px 0'
            }}>
              Únete a Burrito <img src="/imagotipo.png" alt="burrito" style={{ height: '32px', width: 'auto', verticalAlign: 'middle', display: 'inline-block' }} />
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '15px', marginBottom: '32px' }}>
              Empieza a descubrir Piura de verdad
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginBottom: '8px', fontWeight: 600 }}>
                  Nombre completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                  <input 
                    {...register('name')}
                    type="text"
                    placeholder="¿Cómo te llamas?"
                    className="auth-input"
                  />
                </div>
                {errors.name && <p className="error-msg">{errors.name.message}</p>}
              </div>

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
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginBottom: '8px', fontWeight: 600 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                  <input 
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
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
                <PasswordStrengthBar password={passwordValue} />
                {errors.password && <p className="error-msg">{errors.password.message}</p>}
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginBottom: '8px', fontWeight: 600 }}>
                  Confirmar contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                  <input 
                    {...register('confirmPassword')}
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    className="auth-input"
                  />
                </div>
                {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword.message}</p>}
              </div>

              {error && <div className="error-banner">❌ {error}</div>}

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', height: '52px', fontSize: '16px', justifyContent: 'center', marginTop: '12px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '10px' }} />
                    Creando tu cuenta...
                  </>
                ) : (
                  <>Crear mi cuenta <ArrowRight size={18} style={{ marginLeft: '10px' }} /></>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--gray)' }}>o únete con</span>
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
                Continuar con Google
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                  ¿Eres guía local de Piura?
                </p>
                <Link to="/register/churre" style={{ fontFamily: 'var(--font-body)', color: 'var(--amber)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                  Regístrate como Churre →
                </Link>
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '14px', marginBottom: '8px' }}>
                  ¿Ya tienes cuenta?
                </p>
                <Link to="/login" style={{ fontFamily: 'var(--font-body)', color: 'var(--white)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', opacity: 0.7 }}>
                  Iniciar sesión →
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              border: '2px solid #22c55e'
            }}>
              <CheckCircle2 size={40} color="#22c55e" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--white)', margin: '0 0 12px 0' }}>
              ¡Cuenta creada! 🎉
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray)', fontSize: '16px', marginBottom: '32px' }}>
              Bienvenido/a a Burrito. Serás redirigido en unos segundos.
            </p>
            
            <div style={{ width: '100%', height: '4px', background: '#111009', borderRadius: '2px', overflow: 'hidden' }}>
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
        .error-banner {
          background: rgba(255,85,0,0.08);
          border: 1px solid rgba(255,85,0,0.3);
          border-radius: 12px;
          padding: 12px 16px;
          color: 'var(--orange)';
          font-size: 14px;
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
