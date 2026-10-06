import { Star, Lightbulb, Navigation, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Spot } from '../../types/spot'
import { CATEGORY_LABELS } from '../../lib/constants'
import { formatDistance } from '../../lib/formatters'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { spotToStop } from '../../lib/itineraryStops'
import { useEffect, useState } from 'react'

interface Props {
  spot: Spot
  distanceMeters?: number | null
  onClick?: () => void
  isSelecting?: boolean
  /** El spot ya está en la ruta abierta: el botón pasa de "+" a "−". */
  inItinerary?: boolean
  /** Reemplaza el comportamiento del botón (p. ej. elegir un spot para "Mi día"). */
  onAddToItinerary?: () => void
}

// ── Hora actual en Perú (UTC-5, sin DST) ──
function getNowPeru(): Date {
  return new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
}

function getTodayPeru(): string {
  const p = getNowPeru()
  const y = p.getUTCFullYear()
  const m = String(p.getUTCMonth() + 1).padStart(2, '0')
  const d = String(p.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Detecta el estado del evento ──
type EventStatus = 'live' | 'soon' | 'ended' | null

function getEventStatus(spot: Spot): EventStatus {
  if (!spot.eventDate) return null

  const nowPeru = getNowPeru()
  const todayPeru = getTodayPeru()
  const eventStart = spot.eventDate
  const eventEnd = spot.eventDateEnd ?? spot.eventDate

  // Evento ya terminó completamente
  if (todayPeru > eventEnd) return 'ended'

  // Evento aún no llega
  if (todayPeru < eventStart) return null

  // El evento incluye hoy — revisa horario del schedule
  const schedule = spot.schedule ?? {}
  const DAY_NAMES: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
  }
  const todayName = DAY_NAMES[nowPeru.getUTCDay()]
  const hoursStr = schedule[todayName] as string | undefined

  // Sin horario para hoy → live todo el día
  if (!hoursStr) return 'live'
  console.log('schedule:', spot.schedule, 'todayName:', todayName, 'hoursStr:', hoursStr)


  // Parsea "HH:MM - HH:MM" / "H:MM–H:MM" / con punto decimal
  const match = hoursStr.match(/(\d{1,2})[:\.](\d{2})\s*[-–—]\s*(\d{1,2})[:\.](\d{2})/)
  if (!match) return 'live' // no pudo parsear → asumir live

  const startH = parseInt(match[1])
  const startM = parseInt(match[2])
  const endH = parseInt(match[3])
  const endM = parseInt(match[4])

  const nowMins = nowPeru.getUTCHours() * 60 + nowPeru.getUTCMinutes()
  const startMins = startH * 60 + startM
  const endMins = endH * 60 + endM
  const diffMins = startMins - nowMins

  if (nowMins > endMins) return 'ended'
  if (nowMins >= startMins && nowMins <= endMins) return 'live'
  if (diffMins > 0 && diffMins <= 120) return 'soon'

  return null
}

// ── Badge animado ──
function EventBadge({ status }: { status: EventStatus }) {
  if (!status) return null

  const CONFIG = {
    live: {
      bg: 'rgba(34,197,94,0.14)',
      border: 'rgba(34,197,94,0.35)',
      dot: '#22c55e',
      glow: 'rgba(34,197,94,0.8)',
      color: '#22c55e',
      label: 'Ahora',
      pulse: true,
    },
    soon: {
      bg: 'rgba(255,170,0,0.14)',
      border: 'rgba(255,170,0,0.35)',
      dot: '#ffaa00',
      glow: 'rgba(255,170,0,0.8)',
      color: '#ffaa00',
      label: 'Por empezar',
      pulse: false,
    },
    ended: {
      bg: 'rgba(120,120,120,0.1)',
      border: 'rgba(120,120,120,0.25)',
      dot: '#888',
      glow: 'transparent',
      color: '#888',
      label: 'Finalizado',
      pulse: false,
    },
  }

  const c = CONFIG[status]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.7, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: -6 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 9px', borderRadius: '99px',
          background: c.bg,
          border: `1px solid ${c.border}`,
          marginTop: '6px', alignSelf: 'flex-start',
        }}
      >
        {/* Dot pulsante solo para live */}
        <motion.div
          animate={c.pulse
            ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }
            : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: c.dot,
            boxShadow: `0 0 6px ${c.glow}`,
            flexShrink: 0,
          }}
        />
        <Clock size={9} color={c.color} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
          color: c.color, letterSpacing: '0.8px', textTransform: 'uppercase',
        }}>
          {c.label}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Component ──
export default function SpotCard({
  spot,
  distanceMeters,
  onClick,
  isSelecting = false,
  inItinerary = false,
  onAddToItinerary,
}: Props) {
  const { requestAddStop, removeSpot } = useItineraryStore()
  const cat = CATEGORY_LABELS[spot.category]

  // Re-evalúa cada minuto para que el badge cambie automáticamente
  const [eventStatus, setEventStatus] = useState<EventStatus>(() => getEventStatus(spot))

  useEffect(() => {
    setEventStatus(getEventStatus(spot))
    const iv = setInterval(() => setEventStatus(getEventStatus(spot)), 60_000)
    return () => clearInterval(iv)
  }, [spot.id, spot.eventDate, spot.eventDateEnd, JSON.stringify(spot.schedule)])

  // Espejo de toggleInItinerary() en ExploreScreen.kt: si ya está en la ruta
  // se quita; si no, requestAddStop agrega directo o, sin ruta abierta, abre
  // el sheet para crear una (antes el "+" no hacía nada en ese caso).
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToItinerary) onAddToItinerary()
    else if (inItinerary) removeSpot(spot.id)
    else requestAddStop(spotToStop(spot))
  }

  const borderColor = isSelecting
    ? '1px solid rgba(255,85,0,0.4)'
    : eventStatus === 'live'
      ? '1px solid rgba(34,197,94,0.3)'
      : eventStatus === 'soon'
        ? '1px solid rgba(255,170,0,0.3)'
        : eventStatus === 'ended'
          ? '1px solid rgba(120,120,120,0.15)'
          : undefined

  return (
    <motion.div
      className="card"
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{
        cursor: 'pointer',
        display: 'flex', gap: '16px',
        padding: '14px', alignItems: 'flex-start',
        border: borderColor,
        transition: 'border-color 0.3s ease',
      }}
    >
      {/* ── Photo ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <motion.img
          src={spot.photoUrl}
          alt={spot.name}
          style={{
            width: '80px', height: '80px',
            borderRadius: '12px', objectFit: 'cover', display: 'block',
          }}
          loading="lazy"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.22 }}
        />

        {/* Emoji categoría */}
        <span className="badge badge-orange" style={{
          position: 'absolute', top: '4px', left: '4px',
          fontSize: '9px', padding: '2px 6px',
        }}>
          {cat?.emoji}
        </span>

        {/* Glow ring animado cuando está live */}
        <AnimatePresence>
          {eventStatus === 'live' && (
            <motion.div
              key="glow-ring"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{
                opacity: [0.4, 0.85, 0.4],
                scale: [1, 1.05, 1],
              }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: '-3px',
                borderRadius: '14px',
                border: '2px solid rgba(34,197,94,0.55)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Info ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '16px',
          fontWeight: 800, color: 'var(--white)',
          letterSpacing: '-0.5px', lineHeight: 1.2,
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

        {/* Rating + Distancia */}
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

        {/* Tip local */}
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

        {/* Badge de estado del evento */}
        <EventBadge status={eventStatus} />
      </div>

      {/* ── "+" / "−" ── espejo de AddToggleButton() en ExploreScreen.kt:
          ya en la ruta → naranja sólido con "−"; eligiendo spot para "Mi
          día" → resaltado; si no, neutro. El trazo gira media vuelta y el
          brazo vertical se recoge, así se lee como confirmación. */}
      <motion.button
        onClick={handleAddClick}
        whileTap={{ scale: 0.86 }}
        aria-label={inItinerary && !isSelecting ? `Quitar ${spot.name} del itinerario` : `Añadir ${spot.name} al itinerario`}
        style={{
          flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
          border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: inItinerary && !isSelecting ? 'var(--orange)' : isSelecting ? 'rgba(255,85,0,0.12)' : 'var(--card2)',
          color: inItinerary && !isSelecting ? '#ffffff' : isSelecting ? 'var(--orange)' : 'var(--muted)',
          transition: 'background 0.25s ease, color 0.25s ease',
        }}
      >
        <PlusMinus minus={inItinerary && !isSelecting} />
      </motion.button>
    </motion.div>
  )
}

/**
 * Un solo trazo que se transforma — espejo de PlusMinusMorph() en
 * ExploreScreen.kt: el "+" gira media vuelta mientras su brazo vertical se
 * recoge hasta quedar en "−", y al revés vuelve a salir.
 */
function PlusMinus({ minus }: { minus: boolean }) {
  const spring = { type: 'spring' as const, stiffness: 380, damping: 20 }
  return (
    <motion.svg width="18" height="18" viewBox="0 0 18 18" animate={{ rotate: minus ? 180 : 0 }} transition={spring}>
      <line x1="3.5" y1="9" x2="14.5" y2="9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <motion.line
        x1="9" y1="3.5" x2="9" y2="14.5"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
        animate={{ scaleY: minus ? 0 : 1, opacity: minus ? 0 : 1 }}
        transition={spring}
      />
    </motion.svg>
  )
}