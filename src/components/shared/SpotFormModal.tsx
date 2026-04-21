import React, { useState, useRef, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, MapPin, Clock, Camera, Star, DollarSign, ChevronRight, Plus, Percent, Gift, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORY_LABELS } from '../../lib/constants'
import { useUIStore } from '../../stores/useUIStore'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(200),
  localTip: z.string().max(150).optional(),
  address: z.string().min(3),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  price_range: z.enum(['free', 'low', 'mid', 'high']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().min(0).optional(),
})

type FormData = z.infer<typeof schema>

const PRICE_OPTIONS = [
  { value: 'free', label: 'Gratis', icon: '🎁', sub: 'Sin costo' },
  { value: 'low', label: 'Bajo', icon: '💰', sub: '< S/20' },
  { value: 'mid', label: 'Moderado', icon: '💳', sub: 'S/20–60' },
  { value: 'high', label: 'Premium', icon: '✨', sub: '> S/60' },
]

const DAYS = [
  { key: 'mon', short: 'L', label: 'Lunes' },
  { key: 'tue', short: 'M', label: 'Martes' },
  { key: 'wed', short: 'X', label: 'Miércoles' },
  { key: 'thu', short: 'J', label: 'Jueves' },
  { key: 'fri', short: 'V', label: 'Viernes' },
  { key: 'sat', short: 'S', label: 'Sábado' },
  { key: 'sun', short: 'D', label: 'Domingo' },
]

const SECTIONS = [
  { id: 'basic', label: 'Básico', icon: '📝' },
  { id: 'media', label: 'Foto', icon: '📸' },
  { id: 'details', label: 'Detalles', icon: '⭐' },
  { id: 'location', label: 'Ubicación', icon: '📍' },
  { id: 'benefits', label: 'Beneficios', icon: '🎁' },
]

interface Benefit {
  id: string
  type: 'discount' | 'gift' | 'experience' | 'priority'
  title: string
  description: string
  code: string
  discount_pct?: number
  valid_until: string
  active: boolean
}

const BENEFIT_ICONS = { discount: Percent, gift: Gift, experience: Zap, priority: Star }
const BENEFIT_COLORS = {
  discount: { bg: 'rgba(255,85,0,0.10)', border: 'rgba(255,85,0,0.25)', color: 'var(--orange)' },
  gift: { bg: 'rgba(255,209,102,0.10)', border: 'rgba(255,209,102,0.25)', color: 'var(--amber)' },
  experience: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', color: '#22c55e' },
  priority: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)', color: '#8b5cf6' },
}
const BENEFIT_LABELS: Record<string, string> = {
  discount: 'Descuento',
  gift: 'Regalo',
  experience: 'Experiencia',
  priority: 'Acceso VIP',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData & {
    photoUrl?: string
    schedule?: Record<string, string>
    benefits?: Benefit[]
  }) => void
  initialData?: any
}

export default function SpotFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const [activeSection, setActiveSection] = useState('basic')
  const [preview, setPreview] = useState<string | null>(null)
  const [descLen, setDescLen] = useState(0)
  const [tipLen, setTipLen] = useState(0)
  const [schedule, setSchedule] = useState<Record<string, string>>({})
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({})
  const [dragOver, setDragOver] = useState(false)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [addingBenefit, setAdding] = useState(false)
  const [newBenefit, setNewBenefit] = useState<Partial<Benefit>>({ type: 'discount', active: true })
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useUIStore()

  const selectedPrice = watch('price_range')
  const nameVal = watch('name')

  useEffect(() => {
    if (!isOpen) return
    setActiveSection('basic')
    setBenefits([])
    setAdding(false)
    setNewBenefit({ type: 'discount', active: true })

    if (initialData?.id) {
      supabase
        .from('spot_benefits')
        .select('*')
        .eq('spot_id', initialData.id)
        .then(({ data }) => setBenefits((data ?? []) as Benefit[]))
    }

    if (initialData) {
      reset({
        name: initialData.name ?? '',
        category: initialData.category ?? '',
        description: initialData.description ?? '',
        localTip: initialData.localTip ?? '',
        address: initialData.address ?? '',
        lat: initialData.lat ?? -5.1945,
        lng: initialData.lng ?? -80.6328,
        price_range: initialData.price_range ?? undefined,
        rating: initialData.rating ?? undefined,
        review_count: initialData.reviewCount ?? undefined,
      })
      setPreview(initialData.photoUrl || null)
      setDescLen(initialData.description?.length || 0)
      setTipLen(initialData.localTip?.length || 0)
      const sched = initialData.schedule ?? {}
      setSchedule(sched)
      const enabled: Record<string, boolean> = {}
      DAYS.forEach(d => { enabled[d.key] = !!sched[d.key] })
      setEnabledDays(enabled)
    } else {
      reset({ name: '', category: '', description: '', localTip: '', address: '', lat: -5.1945, lng: -80.6328 })
      setPreview(null); setDescLen(0); setTipLen(0); setSchedule({}); setEnabledDays({})
    }
  }, [isOpen, initialData, reset])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleDay = (key: string) => {
    const next = !enabledDays[key]
    setEnabledDays(p => ({ ...p, [key]: next }))
    if (!next) setSchedule(p => { const n = { ...p }; delete n[key]; return n })
    else setSchedule(p => ({ ...p, [key]: '8:00 - 18:00' }))
  }

  const onSubmit: SubmitHandler<FormData> = data => {
    onSave({ ...data, photoUrl: preview || undefined, schedule, benefits })
  }

  const sectionComplete: Record<string, boolean> = {
    basic: !!(watch('name') && watch('category') && watch('description')),
    media: !!preview,
    details: !!selectedPrice,
    location: !!watch('address'),
    benefits: benefits.length > 0,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(4,3,2,0.92)', backdropFilter: 'blur(12px)', zIndex: 400 }}
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}
          >
            <div style={{
              background: '#0e0c09', border: '1px solid rgba(255,85,0,0.15)', borderRadius: '24px',
              width: '100%', maxWidth: '600px', maxHeight: '92vh',
              display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
              overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,85,0,0.08)',
            }}>

              {/* HEADER */}
              <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {initialData ? 'Editar spot' : 'Nuevo spot'}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--white)', margin: 0, letterSpacing: '-0.5px' }}>
                    {nameVal || (initialData ? initialData.name : '¿Dónde es?')}
                  </h2>
                </div>
                <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>

              {/* TABS */}
              <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
                  {SECTIONS.map(sec => (
                    <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeSection === sec.id ? 'rgba(255,85,0,0.15)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', transition: 'all 0.2s', position: 'relative' }}
                    >
                      <span style={{ fontSize: '14px' }}>{sec.icon}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: activeSection === sec.id ? 'var(--orange)' : 'var(--muted)' }}>{sec.label}</span>
                      {sectionComplete[sec.id] && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit(onSubmit as any)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                  <AnimatePresence mode="wait">

                    {/* BÁSICO */}
                    {activeSection === 'basic' && (
                      <motion.div key="basic" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Field label="Nombre del spot" error={errors.name?.message}>
                          <input {...register('name')} className="input" placeholder="Ej. Cebichería Don Miguel" style={inputStyle} />
                        </Field>
                        <Field label="Categoría" error={errors.category?.message}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {Object.entries(CATEGORY_LABELS).map(([id, cat]) => (
                              <button key={id} type="button" onClick={() => setValue('category', id)}
                                style={{ padding: '10px 6px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: watch('category') === id ? 'rgba(255,85,0,0.12)' : 'rgba(255,255,255,0.04)', outline: watch('category') === id ? '1.5px solid rgba(255,85,0,0.6)' : '1.5px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                              >
                                <span style={{ fontSize: '20px' }}>{(cat as any).emoji}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: watch('category') === id ? 'var(--orange)' : 'var(--muted)' }}>{(cat as any).label}</span>
                              </button>
                            ))}
                          </div>
                          <input type="hidden" {...register('category')} />
                        </Field>
                        <Field label={`Descripción · ${descLen}/200`} error={errors.description?.message}>
                          <textarea {...register('description')} className="input" placeholder="Describe este lugar como le contarías a un amigo..." maxLength={200} onChange={e => setDescLen(e.target.value.length)} style={{ ...inputStyle, height: '96px', resize: 'none' as const }} />
                        </Field>
                        <Field label={`💡 Tip local · ${tipLen}/150`}>
                          <textarea {...register('localTip')} className="input" placeholder="El secreto que solo los locales conocen..." maxLength={150} onChange={e => setTipLen(e.target.value.length)} style={{ ...inputStyle, height: '72px', resize: 'none' as const }} />
                        </Field>
                      </motion.div>
                    )}

                    {/* FOTO */}
                    {activeSection === 'media' && (
                      <motion.div key="media" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                        <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                        {preview ? (
                          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                            <img src={preview} alt="Preview" style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                            <button type="button" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Camera size={12} /> Cambiar
                            </button>
                            <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>✓ Foto lista</div>
                          </div>
                        ) : (
                          <div onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                            style={{ height: '240px', borderRadius: '16px', cursor: 'pointer', border: `2px dashed ${dragOver ? 'var(--orange)' : 'rgba(255,85,0,0.25)'}`, background: dragOver ? 'rgba(255,85,0,0.05)' : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s' }}
                          >
                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Upload size={22} color="var(--orange)" />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>Sube una foto del lugar</div>
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>Arrastra aquí o haz clic · JPG, PNG, WEBP</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* DETALLES */}
                    {activeSection === 'details' && (
                      <motion.div key="details" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <SectionLabel icon={<DollarSign size={12} />} label="Rango de precio" />
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {PRICE_OPTIONS.map(opt => (
                              <button key={opt.value} type="button" onClick={() => setValue('price_range', opt.value as any)}
                                style={{ padding: '12px 6px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: selectedPrice === opt.value ? 'rgba(255,85,0,0.12)' : 'rgba(255,255,255,0.04)', outline: selectedPrice === opt.value ? '1.5px solid rgba(255,85,0,0.6)' : '1.5px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                                <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, color: selectedPrice === opt.value ? 'var(--orange)' : 'var(--white)' }}>{opt.label}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)' }}>{opt.sub}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <SectionLabel icon={<Star size={12} />} label="Rating inicial" />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Field label="Puntuación (0 – 5)">
                              <input type="number" step="0.1" min="0" max="5" {...register('rating')} className="input" placeholder="4.8" style={inputStyle} />
                            </Field>
                            <Field label="Número de reseñas">
                              <input type="number" min="0" {...register('review_count')} className="input" placeholder="128" style={inputStyle} />
                            </Field>
                          </div>
                        </div>
                        <div>
                          <SectionLabel icon={<Clock size={12} />} label="Horarios de atención" />
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
                            {DAYS.map(day => (
                              <button key={day.key} type="button" onClick={() => toggleDay(day.key)}
                                style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: enabledDays[day.key] ? 'rgba(255,85,0,0.15)' : 'rgba(255,255,255,0.04)', outline: enabledDays[day.key] ? '1.5px solid rgba(255,85,0,0.5)' : '1.5px solid rgba(255,255,255,0.06)', color: enabledDays[day.key] ? 'var(--orange)' : 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, transition: 'all 0.15s' }}>
                                {day.short}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {DAYS.filter(d => enabledDays[d.key]).map(day => (
                              <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', width: '80px', flexShrink: 0 }}>{day.label}</span>
                                <input value={schedule[day.key] || ''} onChange={e => setSchedule(p => ({ ...p, [day.key]: e.target.value }))} className="input" placeholder="8:00 - 18:00" style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} />
                              </div>
                            ))}
                            {Object.values(enabledDays).every(v => !v) && (
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>Toca los días para configurar horarios</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* UBICACIÓN */}
                    {activeSection === 'location' && (
                      <motion.div key="location" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Field label="Dirección" error={errors.address?.message}>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={15} color="var(--orange)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input {...register('address')} className="input" placeholder="Jr. Libertad 342, Piura" style={{ ...inputStyle, paddingLeft: '36px' }} />
                          </div>
                        </Field>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <Field label="Latitud" error={errors.lat?.message}>
                            <input type="number" step="0.000001" {...register('lat')} className="input" placeholder="-5.1945" style={inputStyle} />
                          </Field>
                          <Field label="Longitud" error={errors.lng?.message}>
                            <input type="number" step="0.000001" {...register('lng')} className="input" placeholder="-80.6328" style={inputStyle} />
                          </Field>
                        </div>
                        <div style={{ background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                            Para obtener coordenadas exactas: abre Google Maps, haz clic derecho en el lugar y copia las coordenadas.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* BENEFICIOS */}
                    {activeSection === 'benefits' && (
                      <motion.div key="benefits" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Empty state */}
                        {benefits.length === 0 && !addingBenefit && (
                          <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎁</div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: '0 0 4px' }}>Sin beneficios aún</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--dim)', margin: 0 }}>Agrega descuentos, regalos o experiencias exclusivas para los viajeros Burrito</p>
                          </div>
                        )}

                        {/* Lista */}
                        {benefits.map(b => {
                          const colors = BENEFIT_COLORS[b.type]
                          const Icon = BENEFIT_ICONS[b.type]
                          return (
                            <div key={b.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={14} color={colors.color} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: colors.color, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                                  {BENEFIT_LABELS[b.type]}{b.discount_pct ? ` · ${b.discount_pct}% OFF` : ''}
                                </div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                                {b.code && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: colors.color, marginTop: '2px' }}>{b.code}</div>}
                              </div>
                              <button type="button" onClick={() => setBenefits(p => p.filter(x => x.id !== b.id))}
                                style={{ background: 'rgba(255,64,64,0.08)', border: '1px solid rgba(255,64,64,0.2)', borderRadius: '8px', color: '#ff4040', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <X size={13} />
                              </button>
                            </div>
                          )
                        })}

                        {/* Form nuevo beneficio */}
                        {addingBenefit ? (
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {/* Tipo selector */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                              {(Object.entries(BENEFIT_LABELS) as [string, string][]).map(([type, label]) => {
                                const colors = BENEFIT_COLORS[type as keyof typeof BENEFIT_COLORS]
                                const Icon = BENEFIT_ICONS[type as keyof typeof BENEFIT_ICONS]
                                return (
                                  <button key={type} type="button" onClick={() => setNewBenefit(p => ({ ...p, type: type as any }))}
                                    style={{ padding: '10px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: newBenefit.type === type ? colors.bg : 'rgba(255,255,255,0.04)', outline: newBenefit.type === type ? `1.5px solid ${colors.border}` : '1.5px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                                    <Icon size={14} color={newBenefit.type === type ? colors.color : 'var(--muted)'} />
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: newBenefit.type === type ? colors.color : 'var(--muted)', textAlign: 'center' }}>{label}</span>
                                  </button>
                                )
                              })}
                            </div>

                            <input className="input" placeholder="Título del beneficio" value={newBenefit.title ?? ''} onChange={e => setNewBenefit(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
                            <textarea className="input" placeholder="Descripción para el usuario..." value={newBenefit.description ?? ''} onChange={e => setNewBenefit(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: '64px', resize: 'none' as const }} />

                            <div style={{ display: 'grid', gridTemplateColumns: newBenefit.type === 'discount' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                              <input className="input" placeholder="Código (ej: YACILA10)" value={newBenefit.code ?? ''} onChange={e => setNewBenefit(p => ({ ...p, code: e.target.value.toUpperCase() }))} style={inputStyle} />
                              {newBenefit.type === 'discount' && (
                                <input type="number" className="input" placeholder="% descuento" min="1" max="100" value={newBenefit.discount_pct ?? ''} onChange={e => setNewBenefit(p => ({ ...p, discount_pct: Number(e.target.value) }))} style={inputStyle} />
                              )}
                            </div>

                            <div>
                              <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Válido hasta</label>
                              <input type="date" className="input" value={newBenefit.valid_until ?? ''} onChange={e => setNewBenefit(p => ({ ...p, valid_until: e.target.value }))} style={inputStyle} />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" onClick={() => { setAdding(false); setNewBenefit({ type: 'discount', active: true }) }}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                              <button type="button"
                                onClick={() => {
                                  if (!newBenefit.title || !newBenefit.description) return
                                  setBenefits(p => [...p, { ...newBenefit, id: `new-${Date.now()}`, active: true } as Benefit])
                                  setAdding(false)
                                  setNewBenefit({ type: 'discount', active: true })
                                }}
                                style={{ flex: 2, padding: '10px', borderRadius: '10px', background: 'var(--orange)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                Agregar beneficio
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAdding(true)}
                            style={{ width: '100%', padding: '14px', background: 'transparent', border: '2px dashed rgba(255,85,0,0.25)', borderRadius: '12px', cursor: 'pointer', color: 'var(--orange)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Plus size={15} /> Agregar beneficio
                          </button>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', flexShrink: 0, background: '#0e0c09' }}>
                  <button type="button" onClick={onClose}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  {activeSection !== 'benefits' ? (
                    <button type="button"
                      onClick={() => { const idx = SECTIONS.findIndex(s => s.id === activeSection); if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id) }}
                      style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.3)', color: 'var(--orange)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      Siguiente <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="submit"
                      style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'var(--orange)', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                      {initialData ? 'Actualizar spot ✓' : 'Guardar spot →'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: 'var(--white)', fontFamily: 'var(--font-body)',
  fontSize: '14px', padding: '10px 14px', width: '100%', outline: 'none', transition: 'border-color 0.2s',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>{label}</label>
      {children}
      {error && <p style={{ color: '#ff5555', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-body)' }}>{error}</p>}
    </div>
  )
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
      <span style={{ color: 'var(--orange)' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}