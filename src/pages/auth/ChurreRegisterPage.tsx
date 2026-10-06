import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Lock, Camera, ArrowRight, ArrowLeft,
  Check, Loader2
} from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'
import { AuthHeading, FieldInput } from '../../components/auth/AuthUI'

const churreSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  university: z.enum(['UDEP', 'UNP', 'UCV', 'Independiente']).nullable(),
  bio: z.string().max(280, 'Máximo 280 caracteres').min(20, 'Cuéntanos un poco más'),
  zones: z.array(z.string()).min(1, 'Elige al menos una zona'),
  specialties: z.array(z.string()).min(1, 'Elige al menos una especialidad'),
  terms: z.boolean().refine(v => v === true, 'Debes aceptar los términos')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type FormFields = z.infer<typeof churreSchema>

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Únete como Churre', subtitle: 'Crea tu cuenta de guía local en un par de minutos.' },
  2: { title: 'Tu experiencia', subtitle: 'Cuéntanos quién eres para verificar tu perfil.' },
  3: { title: 'Tus zonas', subtitle: 'Elige las zonas que conoces muy bien.' },
}

const SPECIALTIES = [
  { id: 'beach', label: '🏖️ Playa y mar' },
  { id: 'food', label: '🍽️ Gastronomía' },
  { id: 'mountain', label: '🏔️ Sierra' },
  { id: 'art', label: '🎨 Arte y cultura' },
  { id: 'adventure', label: '🌊 Aventura' },
  { id: 'markets', label: '🛍️ Mercados' },
]

const ZONES = [
  'Piura', 'Catacaos', 'Paita', 'Colán', 'Yacila', 'Talara',
  'Lobitos', 'Canchaque', 'Chulucanas', 'Huancabamba', 'Sechura', 'Sullana'
]

export default function ChurreRegisterPage() {
  const [step, setStep] = useState(1)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const { registerChurre, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<FormFields>({
    resolver: zodResolver(churreSchema),
    defaultValues: {
      zones: [],
      specialties: [],
      university: null,
      terms: false
    }
  })

  const passwordValue = watch('password')
  const bioValue = watch('bio') || ''
  const selectedZones = watch('zones') || []
  const selectedSpecialties = watch('specialties') || []
  const selectedUni = watch('university')

  const handleNext = async () => {
    let fieldsToValidate: any = []
    if (step === 1) fieldsToValidate = ['name', 'email', 'password', 'confirmPassword']
    if (step === 2) fieldsToValidate = ['university', 'bio', 'specialties']

    const isValid = await trigger(fieldsToValidate)
    if (isValid) setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const toggleZone = (zone: string) => {
    const current = selectedZones
    setValue('zones', current.includes(zone) ? current.filter(z => z !== zone) : [...current, zone])
  }

  const toggleSpecialty = (id: string) => {
    const current = selectedSpecialties
    setValue('specialties', current.includes(id) ? current.filter(s => s !== id) : [...current, id])
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: FormFields) => {
    try {
      await registerChurre(data)
      navigate('/waiting-approval')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '440px' }}>
      {/* Progress Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <StepIndicator current={step} target={1} label="Cuenta" />
          <StepIndicator current={step} target={2} label="Perfil" />
          <StepIndicator current={step} target={3} label="Zonas" />
        </div>
        <div style={{ height: '4px', background: 'var(--dim)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${((step - 1) / 2) * 100}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--orange)', borderRadius: '2px' }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            >
              <AuthHeading title={STEP_TITLES[1].title} subtitle={STEP_TITLES[1].subtitle} />

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative', background: 'var(--card2)'
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={20} color="var(--muted)" />
                      <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Subir foto</span>
                    </>
                  )}
                  <input id="avatar-input" type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FieldInput label="Nombre completo" icon={<User size={18} />} {...register('name')} placeholder="¿Cómo te llamas?" error={errors.name?.message} />
                <FieldInput label="Email" icon={<Mail size={18} />} type="email" {...register('email')} placeholder="tu@email.com" error={errors.email?.message} />
                <div className="auth-field">
                  <FieldInput label="Contraseña" icon={<Lock size={18} />} type="password" {...register('password')} placeholder="Mínimo 8 caracteres" />
                  <PasswordStrengthBar password={passwordValue} />
                  {errors.password && <p className="error-msg">{errors.password.message}</p>}
                </div>
                <FieldInput label="Confirmar contraseña" type="password" icon={<Lock size={18} />} {...register('confirmPassword')} placeholder="Repite tu contraseña" error={errors.confirmPassword?.message} />
              </div>

              <button type="button" onClick={handleNext} className="auth-btn-primary" style={{ marginTop: '28px' }}>
                Continuar <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            >
              <AuthHeading title={STEP_TITLES[2].title} subtitle={STEP_TITLES[2].subtitle} />

              <div style={{ marginBottom: '24px' }}>
                <label className="auth-field-label">¿Dónde estudias o estudiaste?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['UDEP', 'UNP', 'UCV', 'Independiente'].map(u => (
                    <div
                      key={u}
                      onClick={() => setValue('university', u as any)}
                      style={{
                        padding: '12px', background: 'var(--card2)', border: selectedUni === u ? '1px solid var(--orange)' : '1px solid var(--border)',
                        borderRadius: '10px', textAlign: 'center', color: selectedUni === u ? 'var(--orange)' : 'var(--white)',
                        fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {u}
                    </div>
                  ))}
                </div>
                {errors.university && <p className="error-msg">{errors.university.message}</p>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="auth-field-label" style={{ margin: 0 }}>Bio corta</label>
                  <span style={{ fontSize: '11px', color: bioValue.length > 250 ? 'var(--orange)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{bioValue.length}/280</span>
                </div>
                <textarea
                  {...register('bio')}
                  placeholder="Soy de Piura, conozco cada rincón de la ciudad desde chico..."
                  className="churre-textarea"
                />
                {errors.bio && <p className="error-msg">{errors.bio.message}</p>}
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="auth-field-label">¿En qué te especializas?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SPECIALTIES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => toggleSpecialty(s.id)}
                      style={{
                        padding: '8px 14px', borderRadius: '100px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)',
                        background: selectedSpecialties.includes(s.id) ? 'var(--orange)' : 'var(--card2)',
                        color: selectedSpecialties.includes(s.id) ? 'white' : 'var(--muted)',
                        border: selectedSpecialties.includes(s.id) ? '1px solid var(--orange)' : '1px solid var(--border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
                {errors.specialties && <p className="error-msg">{errors.specialties.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={handleBack} className="auth-btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button type="button" onClick={handleNext} className="auth-btn-primary" style={{ flex: 2 }}>
                  Continuar <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            >
              <AuthHeading title={STEP_TITLES[3].title} subtitle={STEP_TITLES[3].subtitle} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '28px' }}>
                {ZONES.map(z => (
                  <div
                    key={z}
                    onClick={() => toggleZone(z)}
                    style={{
                      padding: '10px 4px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      background: selectedZones.includes(z) ? 'var(--orange)' : 'var(--card2)',
                      color: selectedZones.includes(z) ? 'white' : 'var(--muted)',
                      border: selectedZones.includes(z) ? '1px solid var(--orange)' : '1px solid var(--border)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {z}
                  </div>
                ))}
              </div>
              {errors.zones && <p className="error-msg" style={{ marginTop: '-20px', marginBottom: '20px' }}>{errors.zones.message}</p>}

              <div style={{ marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <input type="checkbox" {...register('terms')} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--orange)' }} />
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                  Acepto los <Link to="/terms" className="auth-link">términos y condiciones</Link> de Burrito y confirmo que soy mayor de edad.
                </p>
              </div>
              {errors.terms && <p className="error-msg" style={{ marginTop: '-20px', marginBottom: '20px' }}>{errors.terms.message}</p>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={handleBack} className="auth-btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button type="submit" disabled={isLoading} className="auth-btn-primary" style={{ flex: 2 }}>
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar solicitud'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <style>{`
        .churre-textarea {
          width: 100%;
          height: 100px;
          background: var(--card2);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 12px 16px;
          color: var(--white);
          font-family: var(--font-body);
          font-size: 14px;
          resize: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .churre-textarea::placeholder { color: var(--muted); }
        .churre-textarea:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(255,85,0,0.1);
        }
      `}</style>
    </div>
  )
}

function StepIndicator({ current, target, label }: { current: number, target: number, label: string }) {
  const isDone = current > target
  const isActive = current === target
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', background: isDone || isActive ? 'var(--orange)' : 'var(--dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: isDone || isActive ? 'white' : 'var(--muted)', fontWeight: 700,
        transition: 'background 0.25s'
      }}>
        {isDone ? <Check size={12} /> : target}
      </div>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isActive ? 'var(--white)' : 'var(--muted)', fontWeight: isActive ? 700 : 400 }}>{label}</span>
    </div>
  )
}
