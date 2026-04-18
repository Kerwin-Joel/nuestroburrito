import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/useUIStore'

const schema = z.object({
  type: z.enum(['clima', 'evento', 'alerta', 'tip']),
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(150),
  emoji: z.string().min(1, 'Agrega un emoji'),
  publishDate: z.string().min(10, 'Selecciona una fecha'),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initialData?: any
}

export default function FeedEntryModal({ isOpen, onClose, onSave, initialData }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'evento',
      title: '',
      description: '',
      emoji: '🎵',
      publishDate: new Date().toISOString().split('T')[0],
      active: true,
      ...initialData
    }
  })
  
  const { addToast } = useUIStore()

  useEffect(() => {
    if (isOpen) {
      reset({
        type: 'evento',
        title: '',
        description: '',
        emoji: '🎵',
        publishDate: new Date().toISOString().split('T')[0],
        active: true,
        ...initialData
      })
    }
  }, [isOpen, initialData, reset])

  const onSubmit: SubmitHandler<FormData> = (data) => {
    onSave(data)
    addToast({ 
      type: 'success', 
      message: initialData ? 'Entrada actualizada' : 'Nueva entrada publicada' 
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(5,4,3,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px', pointerEvents: 'none'
            }}
          >
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              pointerEvents: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                  {initialData ? 'Editar entrada' : 'Nueva entrada diario'}
                </h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit as any)} style={{ padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Tipo</label>
                      <select {...register('type')} className="input" style={{ width: '100%' }}>
                        <option value="clima">☀️ Clima</option>
                        <option value="evento">🎵 Evento</option>
                        <option value="alerta">⚠️ Alerta</option>
                        <option value="tip">💡 Tip</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Emoji</label>
                      <input {...register('emoji')} className="input" placeholder="🎵" style={{ textAlign: 'center' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Fecha de publicación</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} color="var(--orange)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="date" 
                        {...register('publishDate')} 
                        className="input" 
                        style={{ width: '100%', paddingLeft: '40px' }} 
                      />
                    </div>
                    {errors.publishDate && <span style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px' }}>{errors.publishDate.message}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Título</label>
                    <input {...register('title')} className="input" placeholder="Ej. 28°C · Soleado" style={{ width: '100%' }} />
                    {errors.title && <span style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px' }}>{errors.title.message}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>Descripción</label>
                    <textarea 
                      {...register('description')} 
                      className="input" 
                      placeholder="Resumen corto de la noticia o alerta..." 
                      style={{ width: '100%', height: '80px', resize: 'none' }} 
                    />
                    {errors.description && <span style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px' }}>{errors.description.message}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--dim)', borderRadius: '12px' }}>
                    <input type="checkbox" {...register('active')} id="is-active" style={{ cursor: 'pointer' }} />
                    <label htmlFor="is-active" style={{ fontSize: '14px', color: 'var(--white)', cursor: 'pointer' }}>Visible hoy en el feed</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                    <Save size={16} /> {initialData ? 'Actualizar' : 'Publicar entrada'}
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
