import { useState, useRef, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORY_LABELS, ZONES } from '../../lib/constants'
import { useUIStore } from '../../stores/useUIStore'

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(200),
  localTip: z.string().max(150).optional(),
  address: z.string().min(3),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData & { photoUrl?: string }) => void
  initialData?: any
}

export default function SpotFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      category: '',
      description: '',
      localTip: '',
      address: '',
      lat: -5.1945,
      lng: -80.6328,
      ...initialData
    }
  })

  const [preview, setPreview] = useState<string | null>(initialData?.photoUrl || null)
  const [descLen, setDescLen] = useState(initialData?.description?.length || 0)
  const [tipLen, setTipLen] = useState(initialData?.localTip?.length || 0)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useUIStore()

  // Reset form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          category: initialData.category,
          description: initialData.description,
          localTip: initialData.localTip || '',
          address: initialData.address,
          lat: initialData.lat,
          lng: initialData.lng
        })
        setPreview(initialData.photoUrl || null)
        setDescLen(initialData.description?.length || 0)
        setTipLen(initialData.localTip?.length || 0)
      } else {
        reset({ name: '', category: '', description: '', localTip: '', address: '', lat: -5.1945, lng: -80.6328 })
        setPreview(null)
        setDescLen(0)
        setTipLen(0)
      }
    }
  }, [isOpen, initialData, reset])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit: SubmitHandler<FormData> = (data) => {
    onSave({ ...data, photoUrl: preview || undefined })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(5,4,3,0.88)', backdropFilter: 'blur(8px)', zIndex: 400 }}
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', inset: '0', zIndex: 401,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              background: 'var(--card)',
              border: '1px solid rgba(255,120,30,0.18)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              pointerEvents: 'auto',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '-0.5px', color: 'var(--white)' }}>
                  {initialData ? 'Editar spot' : 'Nuevo spot local'}
                </h2>
                <button onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit as any)}>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Section 1: Basic */}
                  <p className="section-label">INFORMACIÓN BÁSICA</p>

                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      Nombre del spot
                    </label>
                    <input {...register('name')} className="input" placeholder="Ej. Playa Yacila" aria-label="Nombre del spot" />
                    {errors.name && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      Categoría
                    </label>
                    <select {...register('category')} className="input" aria-label="Categoría" style={{ cursor: 'pointer' }}>
                      <option value="">Selecciona una categoría</option>
                      {Object.entries(CATEGORY_LABELS).map(([id, cat]) => (
                        <option key={id} value={id}>{cat.emoji} {cat.label}</option>
                      ))}
                    </select>
                    {errors.category && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.category.message}</p>}
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      Descripción <span style={{ color: 'var(--gray)' }}>({descLen}/200)</span>
                    </label>
                    <textarea
                      {...register('description')}
                      className="input"
                      placeholder="Describe este lugar como lo harías con un amigo..."
                      aria-label="Descripción"
                      maxLength={200}
                      onChange={e => setDescLen(e.target.value.length)}
                      style={{ height: '80px' }}
                    />
                    {errors.description && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.description.message}</p>}
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      💡 Tip local piurano <span style={{ color: 'var(--gray)' }}>({tipLen}/150)</span>
                    </label>
                    <textarea
                      {...register('localTip')}
                      className="input"
                      placeholder="Lo que solo tú sabes de este lugar..."
                      aria-label="Tip local"
                      maxLength={150}
                      onChange={e => setTipLen(e.target.value.length)}
                      style={{ height: '70px' }}
                    />
                  </div>

                  {/* Section 2: Photo */}
                  <p className="section-label">FOTO</p>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} aria-label="Foto del spot" />
                    {preview ? (
                      <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setPreview(null)}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(8,7,5,0.8)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: '100%', padding: '32px',
                          background: 'var(--card2)',
                          border: '2px dashed rgba(255,85,0,0.3)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                          color: 'var(--muted)',
                        }}
                      >
                        <Upload size={24} color="var(--orange)" />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>Arrastra tu foto aquí o haz clic</span>
                      </button>
                    )}
                  </div>

                  {/* Section 3: Location */}
                  <p className="section-label">UBICACIÓN</p>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      Dirección
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} color="var(--orange)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        {...register('address')}
                        className="input"
                        placeholder="Jr. Libertad 342, Piura"
                        aria-label="Dirección"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                    {errors.address && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.address.message}</p>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('lat')}
                        className="input"
                        placeholder="-5.1945"
                      />
                      {errors.lat && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.lat.message}</p>}
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('lng')}
                        className="input"
                        placeholder="-80.6328"
                      />
                      {errors.lng && <p style={{ color: '#ff4040', fontSize: '12px', marginTop: '4px' }}>{errors.lng.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                    {initialData ? 'Actualizar spot' : 'Guardar spot →'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
