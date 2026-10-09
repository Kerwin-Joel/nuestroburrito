import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, LinkIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { authService } from '../../services/auth'
import { AuthHeading, FieldInput, ErrorBanner, authStepMotion } from '../../components/auth/AuthUI'

type Stage = 'checking' | 'invalid' | 'form' | 'done'

const MIN_LENGTH = 8

/**
 * Destino del correo de "¿Olvidaste tu contraseña?". Supabase llega aquí con
 * la sesión de recuperación en la URL (#access_token=… o ?code=…); con esa
 * sesión se puede fijar la contraseña nueva.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('checking')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      // Link vencido o ya usado: Supabase lo avisa en el hash.
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const hashError = hash.get('error_description')
      if (hashError) {
        if (!cancelled) {
          setLinkError(hash.get('error_code') === 'otp_expired'
            ? 'El enlace venció o ya se usó.'
            : hashError.replace(/\+/g, ' '))
          setStage('invalid')
        }
        return
      }

      // Flujo PKCE: el link trae ?code= que hay que canjear por la sesión.
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error && !cancelled) {
          setLinkError(error.message)
          setStage('invalid')
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        setStage('form')
        // Limpia el token de la barra de direcciones.
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        setStage('invalid')
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && confirm !== password
  const canSubmit = password.length >= MIN_LENGTH && confirm === password && !saving

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await authService.updatePassword(password)
      setStage('done')
    } catch (err: any) {
      setError(err.message?.includes('different from the old')
        ? 'La contraseña nueva debe ser distinta a la anterior.'
        : err.message ?? 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const visibilityToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="auth-field-right"
      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {stage === 'checking' && (
          <motion.div key="checking" {...authStepMotion}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px 0', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            <Loader2 size={20} className="animate-spin" /> Verificando el enlace…
          </motion.div>
        )}

        {stage === 'invalid' && (
          <motion.div key="invalid" {...authStepMotion} style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#ef4444',
            }}>
              <LinkIcon size={30} />
            </div>
            <AuthHeading
              title="Enlace no válido"
              subtitle={`${linkError ?? 'Este enlace no sirve para cambiar la contraseña.'} Pide uno nuevo y ábrelo en este mismo navegador.`}
            />
            <Link to="/forgot-password" className="auth-btn-primary" style={{ textDecoration: 'none' }}>
              Pedir otro enlace <ArrowRight size={18} />
            </Link>
            <div style={{ marginTop: '20px' }}>
              <Link to="/login" className="auth-link-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                ← Volver al login
              </Link>
            </div>
          </motion.div>
        )}

        {stage === 'form' && (
          <motion.div key="form" {...authStepMotion}>
            <AuthHeading
              title="Nueva contraseña"
              subtitle="Elige una contraseña para entrar con tu correo."
            />
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FieldInput
                label="Contraseña nueva"
                icon={<Lock size={18} />}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
                error={tooShort ? `Usa al menos ${MIN_LENGTH} caracteres` : undefined}
                rightSlot={visibilityToggle}
              />
              <FieldInput
                label="Repite la contraseña"
                icon={<Lock size={18} />}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null) }}
                placeholder="Otra vez, para confirmar"
                error={mismatch ? 'Las contraseñas no coinciden' : undefined}
              />

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <button type="submit" disabled={!canSubmit} className="auth-btn-primary">
                {saving
                  ? <><Loader2 size={20} className="animate-spin" /> Guardando…</>
                  : <>Guardar contraseña <ArrowRight size={18} /></>}
              </button>
            </form>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" {...authStepMotion} style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e',
            }}>
              <ShieldCheck size={32} />
            </div>
            <AuthHeading
              title="¡Listo!"
              subtitle="Tu contraseña quedó guardada. Desde ahora puedes entrar con tu correo y esta contraseña."
            />
            {/* Ya hay sesión: /login redirige solo al panel que corresponde al rol. */}
            <button onClick={() => navigate('/login', { replace: true })} className="auth-btn-primary">
              Ir a mi panel <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
