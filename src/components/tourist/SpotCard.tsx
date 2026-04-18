import { Star, Lightbulb, Plus, Navigation } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Spot } from '../../types/spot'
import { CATEGORY_LABELS } from '../../lib/constants'
import { formatDistance } from '../../lib/formatters'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useUIStore } from '../../stores/useUIStore'
import type { ItineraryStop } from '../../types/itinerary'

interface Props {
  spot: Spot
  distanceMeters?: number | null
  onClick?: () => void
  isSelecting?: boolean        // ← nuevo
  onAddToItinerary?: () => void // ← nuevo
}

export default function SpotCard({
  spot,
  distanceMeters,
  onClick,
  isSelecting = false,
  onAddToItinerary,
}: Props) {
  const { addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const cat = CATEGORY_LABELS[spot.category]

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToItinerary) {
      onAddToItinerary()
    } else {
      // Comportamiento default — agrega con hora fija
      const stop: ItineraryStop = {
        id: `stop-${Date.now()}`,
        spotId: spot.id,
        spotName: spot.name,
        time: '12:00',
        description: spot.description,
        localTip: spot.localTip,
        travelToNext: '',
        photoUrl: spot.photoUrl,
        lat: spot.lat,
        lng: spot.lng,
        visited: false,
      }
      addStop(stop)
      addToast({ type: 'success', message: `${spot.name} añadido a tu itinerario` })
    }
  }

  return (
    <motion.div
      className="card"
      onClick={onClick}
      whileHover={{ y: -4 }}
      style={{
        cursor: 'pointer',
        display: 'flex', gap: '16px',
        padding: '14px', alignItems: 'flex-start',
        // ← Highlight cuando está en modo selección
        border: isSelecting
          ? '1px solid rgba(255,85,0,0.4)'
          : undefined,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={spot.photoUrl}
          alt={spot.name}
          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
          loading="lazy"
        />
        <span className="badge badge-orange" style={{
          position: 'absolute', top: '4px', left: '4px',
          fontSize: '9px', padding: '2px 6px',
        }}>
          {cat?.emoji}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '16px',
          fontWeight: 800, color: 'var(--white)',
          letterSpacing: '-0.5px', lineHeight: 1.2
        }}>
          {spot.name}
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '13px',
          color: 'var(--muted)', marginTop: '4px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4,
        }}>
          {spot.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={12} color="var(--yellow)" fill="var(--yellow)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--yellow)', fontWeight: 700 }}>
              {spot.rating}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
              ({spot.reviewCount})
            </span>
          </div>
          {distanceMeters != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Navigation size={11} color="var(--gray)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
                {formatDistance(distanceMeters)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <Lightbulb size={12} color="var(--amber)" />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--amber)',
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {spot.localTip}
          </span>
        </div>
      </div>

      {/* Add button — cambia estilo cuando isSelecting */}
      <motion.button
        onClick={handleAddClick}
        whileTap={{ scale: 0.85 }}
        aria-label={`Añadir ${spot.name} al itinerario`}
        className="btn btn-ghost btn-sm"
        style={{
          flexShrink: 0, padding: '8px',
          display: 'flex', alignItems: 'center', gap: '4px',
          background: isSelecting ? 'rgba(255,85,0,0.1)' : undefined,
          borderColor: isSelecting ? 'var(--orange)' : undefined,
          color: isSelecting ? 'var(--orange)' : undefined,
        }}
      >
        <Plus size={14} />
        {isSelecting && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px', fontWeight: 700,
          }}>
            Añadir
          </span>
        )}
      </motion.button>
    </motion.div>
  )
}
