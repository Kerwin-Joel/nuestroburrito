import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, ChevronRight } from 'lucide-react'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'
import HoyEnPiura from '../../components/tourist/HoyEnPiura'
import ItineraryWizardModal from '../../components/tourist/ItineraryWizardModal'
import { useSpots } from '../../hooks/useSpots'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { formatDistance } from '../../lib/formatters'
import { CATEGORY_LABELS } from '../../lib/constants'

/**
 * Portada personal, no una landing: quien la ve ya inició sesión, así que
 * no repetimos el discurso de venta de /landing. Es el mismo espíritu que
 * ui/home/HomeScreen.kt en la app nativa — "¿A dónde hoy?", el spot más
 * cercano como hero, y Hoy en Piura — no un hero de marketing con
 * "La guía piurana".
 */
export default function HomePage() {
  const { filtered: spots, selectSpot, loading, load } = useSpots()
  const { lat: userLat, lng: userLng } = useGeolocation()
  const { current: itinerary } = useItineraryStore()
  const [wizardOpen, setWizardOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  const { hero, rest } = useMemo(() => {
    if (spots.length === 0) return { hero: null, rest: [] }
    if (userLat == null || userLng == null) return { hero: spots[0], rest: spots.slice(1) }
    const withDistance = spots.map(s => ({ spot: s, d: distanceMeters(s.lat, s.lng, userLat, userLng) }))
    withDistance.sort((a, b) => a.d - b.d)
    return { hero: withDistance[0].spot, rest: withDistance.slice(1).map(x => x.spot) }
  }, [spots, userLat, userLng])

  const dist = (lat: number, lng: number) => (userLat != null && userLng != null ? distanceMeters(lat, lng, userLat, userLng) : null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <div className="page-container" style={{ paddingTop: '24px' }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginBottom: '2px' }}>{greeting()}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px' }}>
            ¿A dónde hoy?
          </h1>
        </motion.div>

        <div style={{ marginTop: '20px' }}>
          {loading && !hero ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: '20px' }} />
          ) : hero ? (
            <HeroSpotCard
              spot={hero}
              distanceMeters={dist(hero.lat, hero.lng)}
              onClick={() => selectSpot(hero)}
            />
          ) : null}
        </div>

        <motion.button
          onClick={() => setWizardOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '16px', fontSize: '16px', boxShadow: 'var(--shadow-glow-lg)' }}
        >
          <Sparkles size={18} /> Armar mi día con IA
        </motion.button>

        {itinerary && itinerary.stops.length > 0 && (
          <motion.button
            onClick={() => navigate('/app/itinerario')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '16px', marginTop: '14px', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,85,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={18} color="var(--orange)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14.5px', color: 'var(--white)' }}>Tienes un día en curso</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>{itinerary.stops.length} {itinerary.stops.length === 1 ? 'parada' : 'paradas'} · {itinerary.title || 'Mi día'}</div>
            </div>
            <ChevronRight size={18} color="var(--orange)" />
          </motion.button>
        )}

        {rest.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <p className="section-label" style={{ marginBottom: '14px' }}>{userLat != null ? 'También cerca' : 'También te puede gustar'}</p>
          </div>
        )}
      </div>

      {rest.length > 0 && (
        // Mismo recurso que ui/home/HomeScreen.kt: un carrusel horizontal que
        // llega al borde derecho (no una lista vertical) — la tarjeta
        // siguiente asoma cortada y se lee que hay más.
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingLeft: '20px', paddingRight: '4px', paddingBottom: '2px' }}>
          {rest.slice(0, 8).map(spot => (
            <NearbySpotCard key={spot.id} spot={spot} distanceMeters={dist(spot.lat, spot.lng)} onClick={() => selectSpot(spot)} />
          ))}
        </div>
      )}

      <div className="page-container">
        <div style={{ marginTop: '36px' }}>
          <HoyEnPiura />
        </div>
      </div>

      <SpotBottomSheet />
      <ItineraryWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  )
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Espejo de HeroSpotCard() en HomeParts.kt: solo distancia + nombre + tip
 * local sobre la foto — sin badge de categoría ni estrellas, que ahí no
 * están (esos datos ya se ven al abrir la ficha del spot).
 */
function HeroSpotCard({ spot, distanceMeters, onClick }: { spot: import('../../types/spot').Spot; distanceMeters: number | null; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{
        position: 'relative', width: '100%', height: '260px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer',
        border: '1px solid var(--border)',
      }}
    >
      <img src={spot.photoUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', bottom: '18px', left: '18px', right: '18px' }}>
        {distanceMeters != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
            {formatDistance(distanceMeters).toUpperCase()}
          </span>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: '#fff', letterSpacing: '-0.5px', marginTop: '4px' }}>{spot.name}</h2>
        {spot.localTip && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.88)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {spot.localTip}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Tarjeta compacta para el carrusel "también cerca" — espejo de
 * NearbySpotCard() en HomeParts.kt: foto 96px arriba, nombre y
 * distancia/rating abajo, 156px de ancho.
 */
function NearbySpotCard({ spot, distanceMeters, onClick }: { spot: import('../../types/spot').Spot; distanceMeters: number | null; onClick: () => void }) {
  const cat = CATEGORY_LABELS[spot.category]
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="card"
      style={{ width: '156px', flexShrink: 0, padding: 0, overflow: 'hidden', cursor: 'pointer' }}
    >
      {spot.photoUrl ? (
        <img src={spot.photoUrl} alt={spot.name} style={{ width: '100%', height: '96px', objectFit: 'cover', display: 'block' }} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '96px', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
          {cat?.emoji ?? '📍'}
        </div>
      )}
      <div style={{ padding: '10px 11px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {spot.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px' }}>
          {distanceMeters != null ? formatDistance(distanceMeters) : `★ ${spot.rating}`}
        </div>
      </div>
    </motion.div>
  )
}
