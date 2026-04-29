import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, List, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  { id: null, label: 'Todos', emoji: '✨' },
  ...Object.entries(CATEGORY_LABELS).map(([id, c]) => ({
    id: id as SpotCategory,
    label: (c as any).label,
    emoji: (c as any).emoji,
  })),
]

export default function ExplorarPage() {
  const { load, filtered, setCategory, activeCategory, selectSpot, getDistance } = useSpots()
  const { viewMode, toggleView } = useSpotsStore()
  const { lat: userLat, lng: userLng, error: geoError } = useGeolocation()
  const { current, isSelectingSpot, setSelectingSpot, addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => { load(true) }, [load])

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
        const alreadyInFresh = fresh.stops.some((s: any) => s.spotId === spot.id)
        if (!alreadyInFresh) {
          await itinerariesService.update(current.id, { stops: [...fresh.stops, stop] })
        }
      } catch (err) {
        console.error('Error guardando spot:', err)
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
    <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Banner selección */}
      <AnimatePresence>
        {isSelectingSpot && current && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              background: 'var(--orange)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', zIndex: 900,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={18} color="white" />
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'white', margin: 0 }}>
                  Selecciona un spot
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  Para: {current.title}
                </p>
              </div>
            </div>
            <button onClick={handleCancelSelection} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
              <X size={14} /> Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geo error */}
      {geoError && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '8px 16px', textAlign: 'center', zIndex: 90 }}>
          <span style={{ fontSize: '11px', color: '#ff4040', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            ⚠️ UBICACIÓN DESACTIVADA — Activa GPS para mejor experiencia
          </span>
        </motion.div>
      )}

      {/* ── FILTROS ── */}
      <div style={{
        background: 'var(--card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 800,
      }}>
        {/* Categorías + toggle */}
        <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Scroll de chips con fade derecho */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', gap: '6px', overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              paddingBottom: '2px',
            }}>
              {CATEGORIES.map(({ id, label, emoji }) => {
                const isActive = activeCategory === id
                return (
                  <button
                    key={String(id)}
                    onClick={() => setCategory(id as SpotCategory | null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px', borderRadius: '100px',
                      border: isActive ? '1px solid var(--border-hover)' : '1px solid var(--border)',
                      background: isActive ? 'var(--border)' : 'transparent',
                      color: isActive ? 'var(--orange)' : 'var(--muted)',
                      fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>{emoji}</span>
                    {label}
                  </button>
                )
              })}
            </div>
            {/* Fade derecho */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '32px',
              background: 'linear-gradient(to right, transparent, var(--card))',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Toggle mapa/lista */}
          <div style={{
            display: 'flex', background: 'var(--card2)',
            border: '1px solid var(--border)', borderRadius: '10px',
            overflow: 'hidden', flexShrink: 0, padding: '3px', gap: '2px', flexDirection: 'column'
          }}>
            {([['map', Map, 'Mapa'], ['list', List, 'Lista']] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                onClick={() => viewMode !== mode && toggleView()}
                style={{
                  padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'var(--orange)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contador de resultados */}
        <div style={{ padding: '6px 16px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: filtered.length > 0 ? 'var(--orange)' : 'var(--muted)',
            boxShadow: filtered.length > 0 ? '0 0 6px var(--orange)' : 'none',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>
            {filtered.length} SPOT{filtered.length !== 1 ? 'S' : ''}
            {activeCategory ? ` · ${activeCategory.toUpperCase()}` : ' · PIURA'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, position: 'relative' }}>
        {viewMode === 'map' ? (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ height: 'calc(100vh - 140px)', width: '100%' }}>
            <MapView />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="page-container"
            style={{ paddingTop: '16px', paddingBottom: '120px' }}>
            {filtered.length === 0 ? (
              <div style={{ border: '2px dashed var(--border-hover)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
                  No hay spots en esta categoría aún
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(spot => {
                  const dist = getDistance(spot, userLat ?? undefined, userLng ?? undefined)
                  return (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      distanceMeters={dist ?? undefined}
                      onClick={() => isSelectingSpot ? handleAddSpot(spot) : selectSpot(spot)}
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

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}