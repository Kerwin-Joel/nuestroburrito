import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default'
}: Props) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
          }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 85, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: variant === 'danger' ? '#ef4444' : 'var(--orange)'
            }}>
              <AlertTriangle size={20} />
            </div>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          <h3 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '18px', 
            color: 'var(--white)', 
            margin: '0 0 8px 0',
            fontWeight: 800
          }}>
            {title}
          </h3>

          <p style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '14px', 
            color: 'var(--gray)', 
            lineHeight: 1.5,
            margin: '0 0 24px 0'
          }}>
            {description}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {cancelLabel}
            </button>
            <button 
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`btn ${variant === 'danger' ? '' : 'btn-primary'}`}
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                background: variant === 'danger' ? '#ef4444' : undefined,
                color: variant === 'danger' ? 'white' : undefined,
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
