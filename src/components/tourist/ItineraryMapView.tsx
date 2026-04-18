import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Route, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { useItineraryStore } from '../../stores/useItineraryStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { optimizeRoute, haversineDistance, formatDistance } from '../../lib/routeOptimizer'
import { getRoute, formatDuration, OSRMRoute } from '../../lib/osrm'
import { PIURA_CENTER } from '../../lib/constants'
import type { ItineraryStop } from '../../types/itinerary'
import { motion, AnimatePresence } from 'framer-motion'

// Pin numerado para cada parada
const createNumberedPin = (number: number, visited: boolean) => L.divIcon({
    className: '',
    html: `
    <div style="
      width: 32px; height: 32px;
      background: ${visited ? '#22c55e' : '#FF5500'};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-weight: 800;
        font-size: 13px;
        font-family: sans-serif;
        display: block;
        margin-top: -2px;
        margin-left: 1px;
      ">${number}</span>
    </div>
  `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
})

// Pin usuario
const createUserPin = () => L.divIcon({
    className: '',
    html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;
        background:rgba(77,174,255,0.4);
        border-radius:50%;
        position:absolute;
        animation:pulse-ring 1.5s infinite;
      "></div>
      <div style="
        width:14px;height:14px;
        background:#4daeff;
        border-radius:50%;
        border:2px solid white;
        position:absolute;
        top:3px;left:3px;
        box-shadow:0 0 10px rgba(77,174,255,0.5);
      "></div>
    </div>
    <style>
      @keyframes pulse-ring {
        0%{transform:scale(0.6);opacity:0.8}
        100%{transform:scale(1.8);opacity:0}
      }
    </style>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
})

function MapFitter({ stops }: { stops: ItineraryStop[] }) {
    const map = useMap()
    const fittedRef = useRef(false) // ← flag

    useEffect(() => {
        if (fittedRef.current) return // ← solo una vez

        const validStops = stops.filter(s => s.lat !== 0 && s.lng !== 0)
        if (validStops.length === 0) return

        if (validStops.length === 1) {
            map.setView([validStops[0].lat, validStops[0].lng], 14)
            fittedRef.current = true
            return
        }

        const bounds = L.latLngBounds(
            validStops.map(s => [s.lat, s.lng] as [number, number])
        )
        map.fitBounds(bounds, { padding: [60, 60] })
        fittedRef.current = true // ← marca como ejecutado
    }, [stops])

    return null
}

interface Props {
    onClose: () => void
}

export default function ItineraryMapView({ onClose }: Props) {
    const { current, setCurrent } = useItineraryStore()
    const { lat: userLat, lng: userLng } = useGeolocation()
    const [route, setRoute] = useState<OSRMRoute | null>(null)
    const [loadingRoute, setLoadingRoute] = useState(false)
    const [activeStopIdx, setActiveStopIdx] = useState(0)
    const [optimizing, setOptimizing] = useState(false)
    const [sheetExpanded, setSheetExpanded] = useState(false)
    const [optimizeFrom, setOptimizeFrom] = useState<'gps' | 'first' | null>(null)

    if (!current) return null

    const stops = current.stops.filter(s => s.lat !== 0 && s.lng !== 0)
    const activeStop = stops[activeStopIdx]

    // Carga ruta OSRM
    const loadRoute = async (stopsToRoute: ItineraryStop[]) => {
        const validStops = stopsToRoute.filter(
            s => s.lat !== 0 && s.lng !== 0
        )
        if (validStops.length < 2) return

        setLoadingRoute(true)
        try {
            const points = validStops.map(s => ({ lat: s.lat, lng: s.lng }))
            const osrmRoute = await getRoute(points)
            setRoute(osrmRoute)
        } finally {
            setLoadingRoute(false)
        }
    }

    // Carga ruta inicial al montar
    useEffect(() => {
        loadRoute(current.stops)
    }, [])

    // Optimiza desde GPS
    const handleOptimizeFromGPS = async () => {
        if (!userLat || !userLng) return
        setOptimizing(true)
        try {
            const optimized = optimizeRoute(current.stops, userLat, userLng)
            // ← Primero carga la ruta
            await loadRoute(optimized)
            // ← Luego actualiza el store (causa re-render)
            setCurrent({ ...current, stops: optimized })
            setActiveStopIdx(0)
            setOptimizeFrom('gps')
        } finally {
            setOptimizing(false)
        }
    }

    // Optimiza desde primera parada
    const handleOptimizeFromFirst = async () => {
        const first = current.stops[0]
        if (!first || (first.lat === 0 && first.lng === 0)) return
        setOptimizing(true)
        try {
            const optimized = optimizeRoute(current.stops, first.lat, first.lng)
            // ← Primero carga la ruta
            await loadRoute(optimized)
            // ← Luego actualiza el store
            setCurrent({ ...current, stops: optimized })
            setActiveStopIdx(0)
            setOptimizeFrom('first')
        } finally {
            setOptimizing(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Top bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                zIndex: 10000,
                background: 'rgba(8,7,5,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px',
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        color: 'var(--orange)', letterSpacing: '2px',
                        textTransform: 'uppercase', marginBottom: '2px'
                    }}>
                        Ruta del itinerario
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-display)', fontSize: '16px',
                        fontWeight: 800, color: 'var(--white)',
                        letterSpacing: '-0.5px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {current.title}
                    </p>
                </div>

                {/* Route stats */}
                {route && (
                    <div style={{
                        display: 'flex', gap: '12px', flexShrink: 0,
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                fontFamily: 'var(--font-mono)', fontSize: '13px',
                                fontWeight: 700, color: 'var(--yellow)',
                            }}>
                                {formatDistance(route.distance)}
                            </p>
                            <p style={{
                                fontFamily: 'var(--font-mono)', fontSize: '9px',
                                color: 'var(--gray)', textTransform: 'uppercase',
                            }}>
                                distancia
                            </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                fontFamily: 'var(--font-mono)', fontSize: '13px',
                                fontWeight: 700, color: 'var(--yellow)',
                            }}>
                                {formatDuration(route.duration)}
                            </p>
                            <p style={{
                                fontFamily: 'var(--font-mono)', fontSize: '9px',
                                color: 'var(--gray)', textTransform: 'uppercase',
                            }}>
                                en auto
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        background: 'var(--card2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px', padding: '6px 12px',
                        color: 'var(--muted)', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: '13px',
                        flexShrink: 0,
                    }}
                >
                    ✕ Cerrar
                </button>
            </div>

            {/* Map */}
            <div style={{ flex: 1, marginTop: '64px', marginBottom: sheetExpanded ? '260px' : '140px' }}>
                <MapContainer
                    key={`map-${current.id}`}
                    center={[PIURA_CENTER.lat, PIURA_CENTER.lng]}
                    zoom={12}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />

                    <MapFitter stops={stops} />

                    {/* Route polyline */}
                    {route && (
                        <Polyline
                            positions={route.coordinates}
                            color="#FF5500"
                            weight={4}
                            opacity={0.8}
                            dashArray="8, 4"
                        />
                    )}

                    {/* Stop markers */}
                    {stops.map((stop, idx) => (
                        <Marker
                            key={stop.id}
                            position={[stop.lat, stop.lng]}
                            icon={createNumberedPin(idx + 1, stop.visited)}
                            eventHandlers={{
                                click: () => setActiveStopIdx(idx)
                            }}
                        />
                    ))}

                    {/* User location */}
                    {userLat && userLng && (
                        <Marker
                            position={[userLat, userLng]}
                            icon={createUserPin()}
                            zIndexOffset={1000}
                        />
                    )}
                </MapContainer>
            </div>

            {/* Bottom sheet */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    zIndex: 9999,
                    background: 'var(--card)',
                    borderTop: '1px solid var(--border)',
                    borderRadius: '20px 20px 0 0',
                }}
            >
                {/* Sheet handle */}
                <div
                    onClick={() => setSheetExpanded(!sheetExpanded)}
                    style={{
                        padding: '12px 16px 8px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                    }}
                >
                    <div style={{
                        width: '36px', height: '4px',
                        background: 'var(--dim)', borderRadius: '2px',
                    }} />
                    <motion.div
                        animate={{ rotate: sheetExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <ChevronUp size={18} color="var(--gray)" />
                    </motion.div>
                </div>

                {/* Active stop info */}
                {activeStop && (
                    <div style={{ padding: '0 16px 12px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            gap: '10px', marginBottom: '8px',
                        }}>
                            <motion.div
                                key={activeStopIdx}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: activeStop.visited ? '#22c55e' : 'var(--orange)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 800, fontSize: '13px', color: 'white',
                                }}
                            >
                                {activeStopIdx + 1}
                            </motion.div>

                            <motion.div
                                key={activeStop.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                <p style={{
                                    fontFamily: 'var(--font-display)', fontSize: '16px',
                                    fontWeight: 800, color: 'var(--white)',
                                    letterSpacing: '-0.5px', margin: 0,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {activeStop.spotName}
                                </p>
                                <p style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                                    color: 'var(--orange)', margin: 0,
                                }}>
                                    {activeStop.time}
                                    {userLat && userLng && activeStop.lat !== 0 && (
                                        <span style={{ color: 'var(--gray)', marginLeft: '8px' }}>
                                            · {formatDistance(haversineDistance(
                                                userLat, userLng,
                                                activeStop.lat, activeStop.lng
                                            ))} de ti
                                        </span>
                                    )}
                                </p>
                            </motion.div>

                            {/* Prev/Next stop */}
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setActiveStopIdx(Math.max(0, activeStopIdx - 1))}
                                    disabled={activeStopIdx === 0}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: 'var(--card2)', border: '1px solid var(--border)',
                                        color: 'var(--muted)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: activeStopIdx === 0 ? 0.3 : 1,
                                    }}
                                >
                                    <ChevronDown size={16} />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setActiveStopIdx(Math.min(stops.length - 1, activeStopIdx + 1))}
                                    disabled={activeStopIdx === stops.length - 1}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: 'var(--card2)', border: '1px solid var(--border)',
                                        color: 'var(--muted)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: activeStopIdx === stops.length - 1 ? 0.3 : 1,
                                    }}
                                >
                                    <ChevronUp size={16} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Expanded content con animación */}
                        <AnimatePresence>
                            {sheetExpanded && (
                                <motion.div
                                    key="expanded"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{
                                        height: { type: 'spring', stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{
                                        paddingTop: '8px',
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex', flexDirection: 'column', gap: '10px',
                                    }}>
                                        {/* Stop list */}
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', gap: '6px',
                                            maxHeight: '120px', overflowY: 'auto',
                                        }}>
                                            <AnimatePresence>
                                                {stops.map((stop, idx) => (
                                                    <motion.div
                                                        key={stop.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        onClick={() => setActiveStopIdx(idx)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            padding: '6px 8px', borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            background: activeStopIdx === idx
                                                                ? 'rgba(255,85,0,0.08)' : 'transparent',
                                                            border: activeStopIdx === idx
                                                                ? '1px solid rgba(255,85,0,0.2)'
                                                                : '1px solid transparent',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '22px', height: '22px',
                                                            borderRadius: '50%', flexShrink: 0,
                                                            background: stop.visited ? '#22c55e' : 'var(--orange)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontFamily: 'var(--font-display)',
                                                            fontWeight: 800, fontSize: '11px', color: 'white',
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <p style={{
                                                            fontFamily: 'var(--font-body)', fontSize: '13px',
                                                            color: stop.visited ? 'var(--muted)' : 'var(--white)',
                                                            fontWeight: 600, margin: 0, flex: 1,
                                                            textDecoration: stop.visited ? 'line-through' : 'none',
                                                        }}>
                                                            {stop.spotName}
                                                        </p>
                                                        <span style={{
                                                            fontFamily: 'var(--font-mono)', fontSize: '11px',
                                                            color: 'var(--orange)', flexShrink: 0,
                                                        }}>
                                                            {stop.time}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        {/* Optimize buttons */}
                                        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={handleOptimizeFromGPS}
                                                disabled={optimizing || !userLat || !userLng}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '10px',
                                                    background: optimizeFrom === 'gps'
                                                        ? 'rgba(255,85,0,0.15)' : 'var(--card2)',
                                                    border: optimizeFrom === 'gps'
                                                        ? '1px solid var(--orange)'
                                                        : '1px solid var(--border)',
                                                    color: optimizeFrom === 'gps' ? 'var(--orange)' : 'var(--muted)',
                                                    fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                                                    cursor: !userLat ? 'not-allowed' : 'pointer',
                                                    opacity: !userLat ? 0.5 : 1,
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', gap: '6px',
                                                }}
                                            >
                                                {optimizing
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <Navigation size={14} />
                                                }
                                                Desde mi GPS
                                            </motion.button>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={handleOptimizeFromFirst}
                                                disabled={optimizing}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '10px',
                                                    background: optimizeFrom === 'first'
                                                        ? 'rgba(255,85,0,0.15)' : 'var(--card2)',
                                                    border: optimizeFrom === 'first'
                                                        ? '1px solid var(--orange)'
                                                        : '1px solid var(--border)',
                                                    color: optimizeFrom === 'first' ? 'var(--orange)' : 'var(--muted)',
                                                    fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', gap: '6px',
                                                }}
                                            >
                                                {optimizing
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <Route size={14} />
                                                }
                                                Desde parada 1
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Loading overlay */}
                <AnimatePresence>
                    {loadingRoute && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '8px',
                                background: 'rgba(8,7,5,0.7)',
                                borderRadius: '20px 20px 0 0',
                            }}
                        >
                            <Loader2 size={18} color="var(--orange)" className="animate-spin" />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '12px',
                                color: 'var(--orange)',
                            }}>
                                Calculando ruta...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}