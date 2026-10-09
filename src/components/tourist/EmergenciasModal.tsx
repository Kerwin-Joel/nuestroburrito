import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Siren } from 'lucide-react'

// Mismos números que EMERGENCY_NUMBERS en ServiciosPage.tsx y en
// MenuSheets.kt del lado nativo — una sola fuente sería lo ideal, pero
// viven en una pantalla y un modal con layouts bien distintos.
const EMERGENCY_NUMBERS = [
  { emoji: '🚨', name: 'Emergencias', detail: 'Central única nacional', number: '911' },
  { emoji: '👮', name: 'Policía de Turismo', detail: 'Piura — atención al turista', number: '073321122' },
  { emoji: '🛡️', name: 'Serenazgo Piura', detail: 'Municipalidad Provincial', number: '073284600' },
  { emoji: '🚒', name: 'Bomberos', detail: 'Compañía de Piura', number: '116' },
  { emoji: '🏥', name: 'Hospital Santa Rosa', detail: 'Emergencias', number: '073324605' },
  { emoji: '🚑', name: 'SAMU', detail: 'Ambulancias', number: '106' },
  { emoji: '🧭', name: 'iPerú', detail: 'Información turística', number: '073476403' },
]

/** Espejo de EmergenciasSheet() en MenuSheets.kt — accesible desde el botón flotante configurable. */
export default function EmergenciasModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(5,4,3,0.6)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1301,
              maxWidth: '480px', margin: '0 auto',
              background: 'var(--card)', borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)', borderBottom: 'none',
              padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
              maxHeight: '80dvh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,64,64,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Siren size={20} color="#ff4040" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--white)' }}>Emergencias en Piura</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>Toca un número para llamar</p>
              </div>
              <button onClick={onClose} aria-label="Cerrar" style={{ background: 'var(--card2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EMERGENCY_NUMBERS.map(n => (
                <a
                  key={n.name}
                  href={`tel:${n.number}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', background: 'var(--card2)' }}
                >
                  <span style={{ fontSize: '18px' }}>{n.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13.5px', color: 'var(--white)' }}>{n.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', color: 'var(--muted)' }}>{n.detail}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {n.number}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
