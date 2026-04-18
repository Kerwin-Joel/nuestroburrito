import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, List, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import MapView from '../../components/shared/MapView'
import SpotCard from '../../components/tourist/SpotCard'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'
import { useSpots } from '../../hooks/useSpots'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useUIStore } from '../../stores/useUIStore'
import { CATEGORY_LABELS } from '../../lib/constants'
import type { SpotCategory } from '../../types/spot'
import type { Spot } from '../../types/spot'
import type { ItineraryStop } from '../../types/itinerary'
import { itinerariesService } from '../../services/itineraries'

const CATEGORIES = [
  { id: null, label: 'Todos' },
  ...Object.entries(CATEGORY_LABELS).map(([id, c]) => ({
    id: id as SpotCategory,
    label: `${c.emoji} ${c.label}`
  })),
]

export default function ExplorarPage() {
  const { load, filtered, setCategory, activeCategory, selectSpot, getDistance } = useSpots()
  const { viewMode, toggleView } = useSpotsStore()
  const { lat: userLat, lng: userLng, error: geoError } = useGeolocation()
  const { current, isSelectingSpot, setSelectingSpot, addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    load(true)
  }, [load])

  const handleAddSpot = async (spot: Spot) => {
    if (!current) return
    if (current.status === 'completed') {
      addToast({ type: 'error', message: 'Este itinerario ya está completado' })
      setSelectingSpot(false)
      navigate('/app/itinerario')
      return
    }

    const alreadyAdded = current.stops.some(s => s.spotId === spot.id)
    if (alreadyAdded) {
      addToast({ type: 'error', message: `${spot.name} ya está en tu itinerario` })
      return
    }

    const lastStop = current.stops[current.stops.length - 1]
    const suggestedTime = lastStop?.time
      ? (() => {
        const [h, m] = lastStop.time.split(':').map(Number)
        const next = new Date()
        next.setHours(h + 1, m, 0, 0)
        return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
      })()
      : '09:00'

    const stop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      spotId: spot.id,
      spotName: spot.name,
      time: suggestedTime,
      description: spot.description,
      localTip: spot.localTip,
      travelToNext: '',
      photoUrl: spot.photoUrl,
      lat: spot.lat,
      lng: spot.lng,
      visited: false,
    }

    addStop(stop)

    if (current.id && current.id !== 'itinerary-demo' && !current.id.startsWith('new-')) {
      try {
        const fresh = await itinerariesService.getById(current.id)
        console.log('Fresh stops:', fresh.stops.length) // ← agrega
        const alreadyInFresh = fresh.stops.some((s: any) => s.spotId === spot.id)
        if (!alreadyInFresh) {
          await itinerariesService.update(current.id, {
            stops: [...fresh.stops, stop],
          })
          console.log('Guardado en Supabase ✅') // ← agrega
        }
      } catch (err) {
        console.error('Error guardando spot:', err) // ← ya lo tienes
      }
    }

    setSelectingSpot(false)
    addToast({ type: 'success', message: `✓ ${spot.name} agregado al itinerario` })
    navigate('/app/itinerario')
  }

  const handleCancelSelection = () => {
    setSelectingSpot(false)
    navigate('/app/itinerario')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Banner de selección */}
      <AnimatePresence>
        {isSelectingSpot && current && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              background: 'var(--orange)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              zIndex: 900,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={18} color="white" />
              <div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  fontWeight: 700, color: 'white', margin: 0,
                }}>
                  Selecciona un spot
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'rgba(255,255,255,0.8)', margin: 0,
                }}>
                  Para: {current.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelSelection}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: '8px',
                padding: '6px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'white', fontFamily: 'var(--font-body)',
                fontSize: '13px', fontWeight: 600,
              }}
            >
              <X size={14} /> Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geolocation Alert */}
      {geoError && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
            padding: '8px 16px',
            textAlign: 'center',
            zIndex: 90
          }}
        >
          <span style={{ fontSize: '11px', color: '#ff4040', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            ⚠️ UBICACIÓN DESACTIVADA: Activa GPS y recarga para una mejor experiencia.
          </span>
        </motion.div>
      )}

      {/* Filter row + toggle */}
      <div style={{
        background: 'rgba(8,7,5,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 0',
        position: 'sticky',
        top: '72px',
        zIndex: 800,
      }}>
        <div className="page-container" style={{
          display: 'flex', alignItems: 'center',
          gap: '12px', justifyContent: 'space-between'
        }}>
          <div className="scroll-row" style={{ flex: 1, minWidth: 0, overflowX: 'auto', paddingRight: '12px' }}>
            {CATEGORIES.map(({ id, label }) => (
              <button
                key={String(id)}
                onClick={() => setCategory(id as SpotCategory | null)}
                className={`chip ${activeCategory === id ? 'selected' : ''}`}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: '10px',
            overflow: 'hidden', flexShrink: 0, padding: '2px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {([['map', Map], ['list', List]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => viewMode !== mode && toggleView()}
                aria-label={mode === 'map' ? 'Ver mapa' : 'Ver lista'}
                style={{
                  padding: '6px 10px',
                  background: viewMode === mode ? 'var(--orange)' : 'transparent',
                  border: 'none', cursor: 'pointer', borderRadius: '8px',
                  color: viewMode === mode ? 'white' : 'var(--gray)',
                  transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {viewMode === 'map' ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ height: 'calc(100vh - 140px)', width: '100%' }}
          >
            <MapView />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="page-container"
            style={{ paddingTop: '24px', paddingBottom: '120px' }}
          >
            {filtered.length === 0 ? (
              <div style={{
                border: '2px dashed rgba(255,85,0,0.3)',
                borderRadius: '16px', padding: '48px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
                  No hay spots en esta categoría aún
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map((spot) => {
                  const dist = getDistance(spot, userLat ?? undefined, userLng ?? undefined)
                  return (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      distanceMeters={dist ?? undefined}
                      onClick={() => isSelectingSpot ? handleAddSpot(spot) : selectSpot(spot)}
                      // ← Pasa prop para mostrar botón "+"
                      isSelecting={isSelectingSpot}
                      onAddToItinerary={() => handleAddSpot(spot)}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <SpotBottomSheet />
    </div>
  )
}