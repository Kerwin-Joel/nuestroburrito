import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle, Check, X } from 'lucide-react'
import type { Tour } from '../../types/tour'
import { formatShortDate, statusLabel, initials } from '../../lib/formatters'

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-amber',
  confirmed: 'badge-green',
  completed: 'badge-orange',
  cancelled: 'badge-red',
}

interface Props {
  tour: Tour
  onUpdateStatus: (id: string, status: Tour['status']) => void
}

export default function TourCard({ tour, onUpdateStatus }: Props) {
  const [expanded, setExpanded] = useState(false)
  const badgeClass = STATUS_BADGE[tour.status]

  const handleWhatsApp = () => {
    const text = `Hola ${tour.touristName}, confirmo tu tour del ${formatShortDate(tour.date)} a las ${tour.time}. ¡Nos vemos!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: '10px', overflow: 'visible' }}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'left',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, #FF5500 0%, #FFAA3B 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '15px',
          color: 'white',
          flexShrink: 0,
        }}>
          {tour.touristAvatar}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', color: 'var(--white)' }}>
              {tour.touristName}
            </span>
            <span className={`badge ${badgeClass}`}>{statusLabel[tour.status]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
              {formatShortDate(tour.date)} · {tour.time}
            </span>
            <span className="badge badge-orange" style={{ fontSize: '10px' }}>
              {tour.type === 'half_day' ? 'Medio día' : 'Día completo'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
            {tour.zones.map(z => (
              <span key={z} className="badge badge-amber" style={{ fontSize: '9px' }}>{z}</span>
            ))}
          </div>
        </div>

        {/* Price + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)', letterSpacing: '-0.5px' }}>
            S/ {tour.price}
          </span>
          <ChevronDown size={16} color="var(--gray)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
              {tour.notes && (
                <div style={{ padding: '12px 0', marginBottom: '12px' }}>
                  <p className="section-label" style={{ marginBottom: '6px' }}>NOTAS DEL TURISTA</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {tour.notes}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleWhatsApp} className="btn btn-green btn-sm" style={{ flex: 1, minWidth: '160px' }}>
                  <MessageCircle size={14} /> Contactar por WhatsApp
                </button>
                {tour.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(tour.id, 'confirmed')}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Check size={14} /> Confirmar
                    </button>
                    <button
                      onClick={() => onUpdateStatus(tour.id, 'cancelled')}
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
