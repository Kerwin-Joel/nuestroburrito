import React, { useState, useRef, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, MapPin, Clock, Camera, Star, DollarSign, ChevronRight, Plus, Percent, Gift, Zap, Globe, MessageCircle, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { CATEGORY_LABELS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import type { SpotSocialLinks } from '../../types/spot'

const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
)

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(400),
  localTip: z.string().max(200).optional(),
  address: z.string().min(3),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  price_range: z.enum(['free', 'low', 'mid', 'high']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().min(0).optional(),
  event_date: z.string().optional(),
  event_date_end: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type PriceRange = 'free' | 'low' | 'mid' | 'high'

const PRICE_OPTIONS = [
  { value: 'free' as PriceRange, label: 'Gratis', icon: '🎁', sub: 'Sin costo' },
  { value: 'low' as PriceRange, label: 'Bajo', icon: '💰', sub: '< S/20' },
  { value: 'mid' as PriceRange, label: 'Moderado', icon: '💳', sub: 'S/20–60' },
  { value: 'high' as PriceRange, label: 'Premium', icon: '✨', sub: '> S/60' },
]

const DAYS = [
  { key: 'Lunes', short: 'L', label: 'Lunes' },
  { key: 'Martes', short: 'M', label: 'Martes' },
  { key: 'Miércoles', short: 'X', label: 'Miércoles' },
  { key: 'Jueves', short: 'J', label: 'Jueves' },
  { key: 'Viernes', short: 'V', label: 'Viernes' },
  { key: 'Sábado', short: 'S', label: 'Sábado' },
  { key: 'Domingo', short: 'D', label: 'Domingo' },
]

const SECTIONS = [
  { id: 'basic', label: 'Básico', icon: '📝' },
  { id: 'media', label: 'Fotos', icon: '📸' },
  { id: 'social', label: 'Redes', icon: '🔗' },
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
  onSave: (data: FormData & { photoUrl?: string; photos?: string[]; schedule?: Record<string, string>; benefits?: Benefit[]; socialLinks?: SpotSocialLinks }) => void
  initialData?: any
}

export default function SpotFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const [activeSection, setActiveSection] = useState('basic')
  const [preview, setPreview] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [descLen, setDescLen] = useState(0)
  const [tipLen, setTipLen] = useState(0)
  const [schedule, setSchedule] = useState<Record<string, string>>({})
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({})
  const [dragOver, setDragOver] = useState(false)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [addingBenefit, setAdding] = useState(false)
  const [newBenefit, setNewBenefit] = useState<Partial<Benefit>>({ type: 'discount', active: true })
  const [socialLinks, setSocialLinks] = useState<SpotSocialLinks>({})
  const [saving, setSaving] = useState(false)
  const [spotFolder, setSpotFolder] = useState<string>('')
  // Estado local para price_range y category — independiente del form
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameVal = watch('name')

  const toFolderName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita tildes
      .replace(/[^a-z0-9\s-]/g, '')    // solo letras, números, guiones
      .trim()
      .replace(/\s+/g, '-')            // espacios → guiones
      .slice(0, 40)                    // máximo 40 chars
  }

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
      // Soporta tanto snake_case como camelCase
      const priceRange = initialData.price_range ?? initialData.priceRange ?? undefined
      const category = initialData.category ?? ''

      reset({
        name: initialData.name ?? '',
        category,
        description: initialData.description ?? '',
        localTip: initialData.localTip ?? initialData.local_tip ?? '',
        address: initialData.address ?? '',
        lat: initialData.lat ?? -5.1945,
        lng: initialData.lng ?? -80.6328,
        price_range: priceRange,
        rating: initialData.rating ?? undefined,
        review_count: initialData.reviewCount ?? initialData.review_count ?? undefined,
        event_date: initialData?.event_date ?? initialData?.eventDate ?? '',
        event_date_end: initialData?.event_date_end ?? initialData?.eventDateEnd ?? '',
      })

      setSelectedPrice(priceRange)
      setSelectedCategory(category)
      setPreview(initialData.photoUrl ?? initialData.photo_url ?? null)
      // Load existing photos array
      const existingPhotos: string[] = initialData.photos ?? []
      setPhotos(existingPhotos)
      // Load social links
      setSocialLinks(initialData.socialLinks ?? initialData.social_links ?? {})
      setDescLen(initialData.description?.length || 0)
      setTipLen((initialData.localTip ?? initialData.local_tip ?? '').length)
      const sched = initialData.schedule ?? {}
      setSchedule(sched)
      const enabled: Record<string, boolean> = {}
      DAYS.forEach(d => { enabled[d.key] = !!sched[d.key] })
      setEnabledDays(enabled)
      setSpotFolder(initialData.id)
    } else {
      reset({ name: '', category: '', description: '', localTip: '', address: '', lat: -5.1945, lng: -80.6328, price_range: undefined, rating: undefined, review_count: undefined, event_date: '', event_date_end: '', })
      setSelectedPrice(undefined)
      setSelectedCategory('')
      setPhotos([])
      setSocialLinks({})
      setPreview(null); setDescLen(0); setTipLen(0); setSchedule({}); setEnabledDays({})
      setSpotFolder(`new-${Date.now()}`)
    }
  }, [isOpen, initialData, reset])

  useEffect(() => {
    if (!initialData?.id && nameVal && nameVal.length >= 3) {
      const sanitized = toFolderName(nameVal)
      if (sanitized) setSpotFolder(`${sanitized}-${Date.now().toString().slice(-6)}`)
    }
  }, [nameVal, initialData])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file)
    if (!preview) setPreview(localUrl)
    setPhotos(p => [...p, localUrl])

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const folder = spotFolder || `spot-${Date.now()}`
      const path = `${folder}/${fileName}`

      const { error } = await supabase.storage
        .from('spot-photos')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('spot-photos')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl

      // Reemplaza placeholder con URL real
      setPhotos(p => p.map(u => u === localUrl ? publicUrl : u))
      setPreview(prev => prev === localUrl ? publicUrl : prev)

    } catch (e: any) {
      setPhotos(p => p.filter(u => u !== localUrl))
      setPreview(prev => prev === localUrl ? null : prev)
      console.error('Error subiendo foto:', e.message)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (i: number) => {
    setPhotos(p => {
      const next = p.filter((_, idx) => idx !== i)
      // Keep preview in sync with first remaining photo
      setPreview(next[0] ?? null)
      return next
    })
  }

  const toggleDay = (key: string) => {
    const next = !enabledDays[key]
    setEnabledDays(p => ({ ...p, [key]: next }))
    if (!next) setSchedule(p => { const n = { ...p }; delete n[key]; return n })
    else setSchedule(p => ({ ...p, [key]: '8:00 - 18:00' }))
  }

  const handlePriceSelect = (price: PriceRange) => {
    setSelectedPrice(price)
    setValue('price_range', price)
  }

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id)
    setValue('category', id)
  }

  const onSubmit: SubmitHandler<FormData> = async data => {
    setSaving(true)
    try {
      await onSave({
        ...data,
        price_range: selectedPrice,
        category: selectedCategory || data.category,
        photoUrl: photos[0] ?? preview ?? undefined,
        photos,
        schedule,
        benefits,
        socialLinks,
      })
    } finally {
      setSaving(false)
    }
  }

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const idx = SECTIONS.findIndex(s => s.id === activeSection)
    if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id)
  }

  const sectionComplete: Record<string, boolean> = {
    basic: !!(watch('name') && selectedCategory && watch('description')),
    media: photos.length > 0,
    social: Object.values(socialLinks).some(Boolean),
    details: !!selectedPrice,
    location: !!watch('address'),
    benefits: benefits.length > 0,
  }

  if (!isOpen) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay, rgba(4,3,2,0.8))', backdropFilter: 'blur(12px)' }} />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.35)', zIndex: 1,
        }}
      >
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
          <button type="button" onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--card2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* TABS */}
        <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--card2)', borderRadius: '12px', padding: '4px' }}>
            {SECTIONS.map(sec => (
              <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeSection === sec.id ? 'rgba(255,85,0,0.15)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', transition: 'all 0.2s', position: 'relative' }}>
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
        <form onSubmit={handleSubmit(onSubmit as any)} onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Hiddens siempre montados */}
          <input type="hidden" {...register('price_range')} />
          <input type="hidden" {...register('category')} />

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* BÁSICO */}
            {activeSection === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label="Nombre del spot" error={errors.name?.message}>
                  <input {...register('name')} className="input" placeholder="Ej. Cebichería Don Miguel" style={inputStyle} />
                </Field>
                <Field label="Categoría" error={errors.category?.message}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {Object.entries(CATEGORY_LABELS).map(([id, cat]) => (
                      <button key={id} type="button" onClick={() => handleCategorySelect(id)}
                        style={{ padding: '10px 6px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: selectedCategory === id ? 'rgba(255,85,0,0.12)' : 'var(--card2)', outline: selectedCategory === id ? '1.5px solid rgba(255,85,0,0.6)' : '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '20px' }}>{(cat as any).emoji}</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: selectedCategory === id ? 'var(--orange)' : 'var(--muted)' }}>{(cat as any).label}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={`Descripción · ${descLen}/400`} error={errors.description?.message}>
                  <textarea {...register('description')} className="input" placeholder="Describe este lugar como le contarías a un amigo..." maxLength={400} onChange={e => setDescLen(e.target.value.length)} style={{ ...inputStyle, height: '96px', resize: 'none' as const }} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="📅 Inicio del evento">
                    <input type="date" {...register('event_date')} className="input" style={inputStyle} />
                  </Field>
                  <Field label="🏁 Fin del evento (opcional)">
                    <input type="date" {...register('event_date_end')} className="input" style={inputStyle} />
                  </Field>
                </div>
                <Field label={`💡 Tip local · ${tipLen}/200`}>
                  <textarea {...register('localTip')} className="input" placeholder="El secreto que solo los locales conocen..." maxLength={200} onChange={e => setTipLen(e.target.value.length)} style={{ ...inputStyle, height: '72px', resize: 'none' as const }} />
                </Field>
              </div>
            )}

            {/* FOTOS — múltiples */}
            {activeSection === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  files.forEach(f => handleFile(f)) // handleFile ya es async, se ejecutan en paralelo
                  if (fileRef.current) fileRef.current.value = ''
                }} style={{ display: 'none' }} />

                {/* Drop zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(false)
                    Array.from(e.dataTransfer.files).forEach(f => handleFile(f))
                  }}
                  style={{
                    height: '120px', borderRadius: '14px', cursor: 'pointer',
                    border: `2px dashed ${dragOver ? 'var(--orange)' : 'rgba(255,85,0,0.25)'}`,
                    background: dragOver ? 'rgba(255,85,0,0.05)' : 'rgba(255,255,255,0.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={18} color="var(--orange)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>Añadir fotos</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>Arrastra o haz clic · puedes subir varias</div>
                  </div>
                </div>

                {/* Photo grid */}
                {photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {photos.map((url, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {i === 0 && (
                          <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--orange)', borderRadius: '6px', padding: '2px 7px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#fff', fontWeight: 700 }}>PORTADA</div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length > 0 && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>
                    {photos.length} foto{photos.length !== 1 ? 's' : ''} · La primera será la portada
                  </p>
                )}
              </div>
            )}

            {/* REDES SOCIALES */}
            {activeSection === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Añade los perfiles en redes para que los viajeros puedan seguir al spot.</p>

                {([
                  { key: 'instagram' as const, Icon: InstagramIcon, label: 'Instagram', placeholder: '@nombre_del_spot', color: '#E1306C' },
                  { key: 'tiktok' as const, Icon: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z" /></svg>, label: 'TikTok', placeholder: '@usuario_tiktok', color: '#010101' },
                  { key: 'facebook' as const, Icon: FacebookIcon, label: 'Facebook', placeholder: 'facebook.com/pagina', color: '#1877F2' },
                  { key: 'whatsapp' as const, Icon: MessageCircle, label: 'WhatsApp', placeholder: '51987654321', color: '#25D366' },
                  { key: 'website' as const, Icon: Globe, label: 'Sitio web', placeholder: 'https://misitioweb.com', color: 'var(--orange)' },
                ] as const).map(({ key, Icon, label, placeholder, color }) => (
                  <div key={key}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ color }}><Icon size={13} /></span>
                      {label}
                    </label>
                    <input
                      className="input"
                      placeholder={placeholder}
                      value={(socialLinks as any)[key] ?? ''}
                      onChange={e => setSocialLinks(p => ({ ...p, [key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <SectionLabel icon={<DollarSign size={12} />} label="Rango de precio" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {PRICE_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => handlePriceSelect(opt.value)}
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
              </div>
            )}

            {/* UBICACIÓN */}
            {activeSection === 'location' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label="Dirección" error={errors.address?.message}>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} color="var(--orange)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input {...register('address')} className="input" placeholder="Jr. Libertad 342, Piura" style={{ ...inputStyle, paddingLeft: '36px' }} />
                  </div>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Latitud" error={errors.lat?.message}>
                    <input type="number" step="any" {...register('lat')} className="input" placeholder="-5.1945" style={inputStyle} />
                  </Field>
                  <Field label="Longitud" error={errors.lng?.message}>
                    <input type="number" step="any" {...register('lng')} className="input" placeholder="-80.6328" style={inputStyle} />
                  </Field>
                </div>
                <div style={{ background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    Para obtener coordenadas exactas: abre Google Maps, haz clic derecho en el lugar y copia las coordenadas.
                  </p>
                </div>
              </div>
            )}

            {/* BENEFICIOS */}
            {activeSection === 'benefits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {benefits.length === 0 && !addingBenefit && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎁</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: '0 0 4px' }}>Sin beneficios aún</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--dim)', margin: 0 }}>Agrega descuentos, regalos o experiencias exclusivas para los viajeros Burrito</p>
                  </div>
                )}
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
                {addingBenefit ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
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
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0, background: 'var(--card)' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            {activeSection !== 'benefits' ? (
              <button type="button" onClick={goNext} disabled={uploading}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.3)',
                  color: uploading ? 'var(--muted)' : 'var(--orange)',
                  fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: uploading ? 0.6 : 1,
                }}>
                {uploading ? '⏳ Subiendo foto...' : <>Siguiente <ChevronRight size={16} /></>}
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px',
                  background: saving ? 'rgba(255,85,0,0.5)' : 'var(--orange)',
                  border: 'none', color: '#fff', fontFamily: 'var(--font-body)',
                  fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                    </svg>
                    {initialData ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  initialData ? 'Actualizar spot ✓' : 'Guardar spot →'
                )}
              </button>
            )}
          </div>
        </form>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>,
    document.body
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card2)', border: '1px solid var(--border)',
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