import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Send } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ChurreInviteModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('')
  const { addToast } = useUIStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    addToast({ type: 'success', message: `Invitación enviada a ${email}` })
    setEmail('')
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
              maxWidth: '440px',
              padding: '32px',
              pointerEvents: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                  Invitar Churre
                </h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                Envía una invitación por correo electrónico para que un nuevo guía local se una a Burrito.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--dim)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px 14px 14px 48px',
                      color: 'white',
                      fontFamily: 'var(--font-body)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                    <Send size={16} /> Enviar invitación
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
