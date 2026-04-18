import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Lock, Camera, ArrowRight, ArrowLeft, 
  Check, CheckCircle2, Loader2, Info
} from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar'

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
    if (current.includes(zone)) {
      setValue('zones', current.filter(z => z !== zone))
    } else {
      setValue('zones', [...current, zone])
    }
  }

  const toggleSpecialty = (id: string) => {
    const current = selectedSpecialties
    if (current.includes(id)) {
      setValue('specialties', current.filter(s => s !== id))
    } else {
      setValue('specialties', [...current, id])
    }
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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <StepIndicator current={step} target={1} label="Cuenta" />
          <StepIndicator current={step} target={2} label="Perfil" />
          <StepIndicator current={step} target={3} label="Zonas" />
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', position: 'relative' }}>
          <motion.div 
            animate={{ width: `${((step - 1) / 2) * 100}%` }}
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
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--white)', margin: '0 0 24px 0' }}>Unete como Churre 🤝</h2>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div 
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative', background: '#111009'
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={20} color="var(--gray)" />
                      <span style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '4px' }}>Subir foto</span>
                    </>
                  )}
                  <input id="avatar-input" type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AuthInput label="Nombre completo" icon={<User size={18}/>} {...register('name')} placeholder="¿Cómo te llamas?" error={errors.name?.message} />
                <AuthInput label="Email" icon={<Mail size={18}/>} {...register('email')} placeholder="tu@email.com" error={errors.email?.message} />
                <div className="form-group">
                  <label className="auth-label">Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                    <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className="auth-input" />
                  </div>
                  <PasswordStrengthBar password={passwordValue} />
                  {errors.password && <p className="error-msg">{errors.password.message}</p>}
                </div>
                <AuthInput label="Confirmar contraseña" type="password" icon={<Lock size={18}/>} {...register('confirmPassword')} placeholder="Repite tu contraseña" error={errors.confirmPassword?.message} />
              </div>

              <button type="button" onClick={handleNext} className="btn btn-primary" style={{ width: '100%', height: '52px', marginTop: '32px' }}>
                Continuar <ArrowRight size={18} style={{ marginLeft: '10px' }} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--white)', margin: '0 0 24px 0' }}>Tu experiencia 🎓</h2>

              <div style={{ marginBottom: '24px' }}>
                <label className="auth-label">¿Dónde estudias o estudiaste?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['UDEP', 'UNP', 'UCV', 'Independiente'].map(u => (
                    <div 
                      key={u}
                      onClick={() => setValue('university', u as any)}
                      style={{
                        padding: '12px', background: '#111009', border: selectedUni === u ? '1px solid var(--orange)' : '1px solid var(--border)',
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
                  <label className="auth-label" style={{ margin: 0 }}>Bio corta</label>
                  <span style={{ fontSize: '11px', color: bioValue.length > 250 ? 'var(--orange)' : 'var(--gray)', fontFamily: 'var(--font-mono)' }}>{bioValue.length}/280</span>
                </div>
                <textarea 
                  {...register('bio')}
                  placeholder="Soy de Piura, conozco cada rincón de la ciudad desde chico..."
                  style={{
                    width: '100%', height: '100px', background: '#111009', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '12px', color: 'white', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'none'
                  }}
                />
                {errors.bio && <p className="error-msg">{errors.bio.message}</p>}
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="auth-label">¿En qué te especializas?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SPECIALTIES.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => toggleSpecialty(s.id)}
                      style={{
                        padding: '8px 14px', borderRadius: '100px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)',
                        background: selectedSpecialties.includes(s.id) ? 'var(--orange)' : '#111009',
                        color: selectedSpecialties.includes(s.id) ? 'white' : 'var(--gray)',
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
                <button type="button" onClick={handleBack} className="btn btn-ghost" style={{ flex: 1 }}><ArrowLeft size={18}/> Atrás</button>
                <button type="button" onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>Continuar <ArrowRight size={18}/></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--white)', margin: '0 0 8px 0' }}>Tus zonas 📍</h2>
              <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '24px' }}>Elige las zonas que conoces muy bien</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '32px' }}>
                {ZONES.map(z => (
                  <div 
                    key={z}
                    onClick={() => toggleZone(z)}
                    style={{
                      padding: '10px 4px', borderRadius: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      background: selectedZones.includes(z) ? 'var(--orange)' : '#111009',
                      color: selectedZones.includes(z) ? 'white' : 'var(--gray)',
                      border: selectedZones.includes(z) ? '1px solid var(--orange)' : '1px solid var(--border)',
                    }}
                  >
                    {z}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <input type="checkbox" {...register('terms')} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--orange)' }} />
                <p style={{ color: 'var(--gray)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                  Acepto los <Link to="/terms" style={{ color: 'var(--amber)', textDecoration: 'none' }}>términos y condiciones</Link> de Burrito y confirmo que soy mayor de edad.
                </p>
              </div>
              {errors.terms && <p className="error-msg" style={{ marginTop: '-24px', marginBottom: '24px' }}>{errors.terms.message}</p>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={handleBack} className="btn btn-ghost" style={{ flex: 1 }}><ArrowLeft size={18}/> Atrás</button>
                <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ flex: 2 }}>
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar solicitud'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <style>{`
        .auth-label { display: block; fontFamily: var(--font-body); fontSize: 14px; color: var(--white); marginBottom: 8px; fontWeight: 600; }
        .auth-input { width: 100%; background: #111009; border: 1px solid var(--border); border-radius: 12px; height: 48px; padding: 0 16px 0 46px; color: white; font-family: var(--font-body); font-size: 15px; transition: all 0.3s; }
        .auth-input:focus { outline: none; border-color: var(--orange); box-shadow: 0 0 0 2px rgba(255,85,0,0.1); }
        .error-msg { color: #ef4444; font-size: 12px; margin-top: 6px; font-family: var(--font-body); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
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
        width: '20px', height: '20px', borderRadius: '50%', background: isDone || isActive ? 'var(--orange)' : 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: isDone || isActive ? 'white' : 'var(--gray)', fontWeight: 700
      }}>
        {isDone ? <Check size={12}/> : target}
      </div>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isActive ? 'var(--white)' : 'var(--gray)', fontWeight: isActive ? 700 : 400 }}>{label}</span>
    </div>
  )
}

const AuthInput = React.forwardRef<HTMLInputElement, any>(({ label, icon, error, type = 'text', ...props }, ref) => (
  <div className="form-group">
    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', marginBottom: '8px', fontWeight: 600 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', display: 'flex' }}>{icon}</div>
      <input ref={ref} type={type} className="auth-input" {...props} />
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontFamily: 'var(--font-body)' }}>{error}</p>}
  </div>
))
AuthInput.displayName = 'AuthInput'
import React from 'react'
