import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, List, X, Plus, ChevronDown } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MapView from '../../components/shared/MapView'
import SpotCard from '../../components/tourist/SpotCard'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'
import ExplorarSkeleton from './ExplorarSkeleton'
import { useSpots } from '../../hooks/useSpots'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useUIStore } from '../../stores/useUIStore'
import { categoriesService } from '../../services/categories'
import type { SpotCategory } from '../../types/spot'
import type { Spot } from '../../types/spot'
import type { ItineraryStop } from '../../types/itinerary'
import { itinerariesService } from '../../services/itineraries'

// CATEGORIES se construye dinámicamente desde Supabase (ver useEffect abajo)

export default function ExplorarPage() {
  const { load, filtered, setCategory, activeCategory, selectSpot, getDistance, loading } = useSpots()
  const { viewMode, toggleView } = useSpotsStore()
  const { lat: userLat, lng: userLng, error: geoError } = useGeolocation()
  const { current, isSelectingSpot, setSelectingSpot, addStop } = useItineraryStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dbCategories, setDbCategories] = useState<{ id: SpotCategory | null; label: string; emoji: string }[]>([
    { id: null, label: 'Todos', emoji: '✨' },
  ])
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)

  useEffect(() => {
    categoriesService.getAll().then(cats => {
      // Alfabético, no por sort_order — igual que en la app nativa
      // (CategoriesRepository.getAll usa Collator es-PE): "Todos" siempre
      // primero, el resto ordenado como lo vería cualquiera buscando una letra.
      const sorted = [...cats].sort((a, b) => a.label.localeCompare(b.label, 'es'))
      setDbCategories([
        { id: null, label: 'Todos', emoji: '✨' },
        ...sorted.map(c => ({ id: c.id as SpotCategory, label: c.label, emoji: c.emoji })),
      ])
    }).catch(() => {})
  }, [])

  const activeCategoryInfo = dbCategories.find(c => c.id === activeCategory) ?? dbCategories[0]

  // Spots que ya están en la ruta abierta: su botón pasa de "+" a "−". Con la
  // ruta completada vuelven todos a "+" (agregar ahí lleva a crear otra).
  const addedSpotIds = new Set(
    current && current.status !== 'completed' ? current.stops.map(s => s.spotId) : [],
  )

  const sortedSpots = [...filtered].sort((a, b) => {
    const dateA = a.eventDate ? new Date(a.eventDate + 'T00:00:00').getTime() : null
    const dateB = b.eventDate ? new Date(b.eventDate + 'T00:00:00').getTime() : null
    if (dateA && dateB) return dateA - dateB
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    return 0
  })

  const { spots } = useSpotsStore()

  useEffect(() => { load(true) }, [load])

  // ── Deep-link: ?spot=<id> ──
  // Abre automáticamente el BottomSheet del spot cuando se llega desde un link compartido.
  // Espera a que los spots estén cargados antes de buscar.
  useEffect(() => {
    const spotId = searchParams.get('spot')
    if (!spotId || spots.length === 0) return

    const target = spots.find(s => s.id === spotId)
    if (target) {
      selectSpot(target)
      // Limpiar el param de la URL para no re-abrir si el usuario cierra y navega
      setSearchParams(prev => {
        prev.delete('spot')
        return prev
      }, { replace: true })
    }
  }, [searchParams, spots, selectSpot, setSearchParams])

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
        {/* Categoría (dropdown) + toggle mapa/lista — mismo layout que
            CategoryDropdown + MapListToggle en ExploreScreen.kt: un botón
            pastilla con la categoría activa (no todos los chips a la vez), y
            el toggle como un par de íconos uno al lado del otro. */}
        <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCategoryMenuOpen(o => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '9px 14px', borderRadius: '100px',
                border: '1px solid var(--border)', background: 'var(--card2)',
                color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '14px' }}>{activeCategoryInfo.emoji}</span>
              {activeCategoryInfo.label}
              <ChevronDown size={16} color="var(--muted)" style={{ transform: categoryMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {categoryMenuOpen && (
                <>
                  <div onClick={() => setCategoryMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 850 }} />
                  <motion.div
                    // Espejo (simplificado) de CategoryDropdown.kt: ahí el
                    // propio botón CRECE hasta volverse el menú. Acá no se
                    // replica la morfosis superficie-a-superficie exacta,
                    // pero sí su sensación — nace anclado en la esquina del
                    // botón y se despliega hacia abajo con un resorte con
                    // leve rebote, no un fade plano.
                    initial={{ opacity: 0, scaleX: 0.7, scaleY: 0.35, y: -8 }}
                    animate={{ opacity: 1, scaleX: 1, scaleY: 1, y: 0 }}
                    exit={{ opacity: 0, scaleX: 0.85, scaleY: 0.5, y: -6, transition: { duration: 0.13 } }}
                    transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 851,
                      width: '228px', maxHeight: '290px', overflowY: 'auto',
                      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.25)', padding: '6px',
                      transformOrigin: 'top left',
                    }}
                  >
                    {dbCategories.filter(c => c.id !== activeCategory).map(({ id, label, emoji }) => (
                      <button
                        key={String(id)}
                        onClick={() => { setCategory(id as SpotCategory | null); setCategoryMenuOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                          padding: '11px 12px', borderRadius: '12px', border: 'none', background: 'transparent',
                          color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '14.5px',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '16px', width: '22px', flexShrink: 0 }}>{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1 }} />

          {/* Toggle mapa/lista — una pastilla horizontal, igual que
              MapListToggle() en la app nativa. */}
          <div style={{
            display: 'flex', background: 'var(--card2)',
            border: '1px solid var(--border)', borderRadius: '12px',
            overflow: 'hidden', flexShrink: 0, padding: '3px', gap: '2px',
          }}>
            {([['map', Map, 'Mapa'], ['list', List, 'Lista']] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                onClick={() => viewMode !== mode && toggleView()}
                aria-label={label}
                style={{
                  padding: '8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'var(--orange)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Contador de resultados — mismo texto que ExploreScreen.kt: siempre
            termina en "· PIURA", sin importar la categoría elegida. */}
        <div style={{ padding: '8px 16px 8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>
            {filtered.length} SPOT{filtered.length !== 1 ? 'S' : ''} · PIURA
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <ExplorarSkeleton viewMode={viewMode} />
        ) : viewMode === 'map' ? (
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
                {sortedSpots.map((spot, index) => {
                  const dist = getDistance(spot, userLat ?? undefined, userLng ?? undefined)
                  return (
                    <motion.div
                      key={spot.id}
                      // Espejo de Modifier.dropIn() en ExploreScreen.kt, pero
                      // más liviano: la versión original animaba 5
                      // propiedades (x/y/rotate/scale/opacity) por tarjeta —
                      // de más en celulares reales, se sentía "trabado" en
                      // vez de caer suave. Con solo y + opacity (2
                      // propiedades, ambas baratas de componer) se mantiene
                      // la sensación de caída sin el costo. Solo las
                      // primeras 8 (las que entran con la lista; el resto,
                      // al hacer scroll, no debe "caer").
                      initial={index < 8 ? { opacity: 0, y: 36 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={index < 8 ? { delay: 0.07 + index * 0.045, type: 'spring', stiffness: 300, damping: 26 } : { duration: 0 }}
                      style={index < 8 ? { willChange: 'transform, opacity' } : undefined}
                    >
                      <SpotCard
                        spot={spot}
                        distanceMeters={dist ?? undefined}
                        onClick={() => isSelectingSpot ? handleAddSpot(spot) : selectSpot(spot)}
                        isSelecting={isSelectingSpot}
                        inItinerary={addedSpotIds.has(spot.id)}
                        onAddToItinerary={isSelectingSpot ? () => handleAddSpot(spot) : undefined}
                      />
                    </motion.div>
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