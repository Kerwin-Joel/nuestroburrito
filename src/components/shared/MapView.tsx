import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
// Debe importarse antes que 'leaflet-rotate': deja `L` en window, que es de
// donde ese plugin lo lee (ver el comentario en leafletRotateSetup.ts).
import L from '../../lib/leafletRotateSetup'
import 'leaflet-rotate'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, ShieldAlert } from 'lucide-react'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { PIURA_CENTER } from '../../lib/constants'
import type { Spot } from '../../types/spot'

/**
 * Pin circular con la foto del spot — espejo de photoPinDrawable() en
 * SpotsMapView.kt (el estilo "Apple Maps": círculo con aro blanco y sombra,
 * naranja mientras no hay foto). El globito con número es el mismo lenguaje
 * que el cluster: "hay N escondidos acá".
 */
function createPhotoPin(photoUrl: string | undefined, selected: boolean, badge?: number) {
  const size = selected ? 60 : 46
  const ring = selected ? 3.5 : 3
  const ringColor = selected ? '#FF5500' : '#fff'
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:100%;height:100%;border-radius:50%;
        border:${ring}px solid ${ringColor};
        box-shadow:0 3px 10px rgba(60,30,0,0.35);
        overflow:hidden;
        background:${photoUrl ? '#e8dcc8' : 'rgba(255,85,0,0.88)'};
        transition:box-shadow 0.2s;
      ">
        ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />` : ''}
      </div>
      ${badge ? `<div style="
        position:absolute; top:-4px; right:-4px; min-width:21px; height:21px; padding:0 2px;
        border-radius:50%; background:#FF5500; border:2px solid #fff;
        display:flex; align-items:center; justify-content:center;
        font:700 11px var(--font-mono, monospace); color:#fff;
      ">${badge}</div>` : ''}
    </div>
  `
  // "burrito-pin": promueve el ícono a su propia capa de composición (ver
  // regla en globals.css) — moverlo en cada cuadro de la animación de
  // agrupado forzaba al navegador a repintar los mosaicos de debajo junto
  // con el pin, y eso es lo que se sentía como "brusco" en un celular real.
  return L.divIcon({ className: 'burrito-pin', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

// Custom pulse blue marker for user
const createUserPin = () => L.divIcon({
  className: '',
  html: `
    <div class="user-location-marker">
      <div class="pulse"></div>
      <div class="dot"></div>
    </div>
    <style>
      .user-location-marker { position: relative; width: 20px; height: 20px; }
      .dot {
        width: 14px; height: 14px;
        background: #4daeff;
        border-radius: 50%;
        border: 2px solid white;
        position: absolute; top: 3px; left: 3px;
        z-index: 2;
        box-shadow: 0 0 10px rgba(77,174,255,0.5);
      }
      .pulse {
        width: 20px; height: 20px;
        background: rgba(77,174,255,0.4);
        border-radius: 50%;
        position: absolute; top: 0; left: 0;
        animation: pulse-ring 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        z-index: 1;
      }
      @keyframes pulse-ring {
        0% { transform: scale(0.6); opacity: 0.8; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface SpotClusterT {
  center: [number, number]
  spots: Spot[]
}

/**
 * Agrupa spots que caen a menos de `radiusPx` de distancia en PANTALLA entre
 * sí (a este nivel de zoom) en un solo punto — espejo de clusterSpots() en
 * SpotsMapView.kt. Sin esto, los spots del centro de Piura se ven como un
 * montón de pines encimados (lo que se veía antes de este cambio).
 */
function clusterSpots(map: L.Map, spots: Spot[], radiusPx = 48): SpotClusterT[] {
  const points = spots.map(spot => {
    const p = map.latLngToContainerPoint([spot.lat, spot.lng])
    return { spot, x: p.x, y: p.y }
  })
  const used = new Array(points.length).fill(false)
  const clusters: SpotClusterT[] = []
  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue
    const group = [points[i].spot]
    used[i] = true
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      if (Math.hypot(dx, dy) <= radiusPx) {
        group.push(points[j].spot)
        used[j] = true
      }
    }
    const avgLat = group.reduce((s, sp) => s + sp.lat, 0) / group.length
    const avgLng = group.reduce((s, sp) => s + sp.lng, 0) / group.length
    clusters.push({ center: [avgLat, avgLng], spots: group })
  }
  return clusters
}

/** Progreso 0→1 con un leve rebote al llegar — misma fórmula y tensión que
 * OvershootInterpolator(0.9f) de animatePins() en SpotsMapView.kt (la
 * tensión anterior, 1.2, se pasaba de rebote y se sentía más brusco que
 * fluido). */
function overshootEase(t: number): number {
  const s = 0.9
  const p = t - 1
  return p * p * ((s + 1) * p + s) + 1
}

const REGROUP_MS = 480

interface PinMove {
  marker: L.Marker
  from: L.LatLng
  to: L.LatLng
  fadeIn?: boolean
  fadeOut?: boolean
  fast?: boolean
}

/**
 * Pines del mapa con agrupado animado — espejo de la sección `else` dentro
 * del `update` de SpotsMapView.kt (clusterSpots + animatePins). No se usa
 * el <Marker> declarativo de react-leaflet porque un cluster no tiene
 * identidad estable entre recómputos (el conjunto de spots que agrupa
 * cambia) — para poder animar "de dónde vino cada pin" hace falta manejar
 * los L.Marker a mano, igual que allá maneja los overlays directamente.
 */
function ClusteredSpotMarkers({ spots, selectedSpot, onSpotClick }: {
  spots: Spot[]
  selectedSpot: Spot | null
  onSpotClick: (spot: Spot) => void
}) {
  const map = useMap()
  // Última posición (y su ícono) en que se dibujó cada spot — de ahí sale
  // "a dónde vuela" un pin que se reagrupa. Espejo de `lastPins` nativo.
  const lastPinsRef = useRef<Map<string, { pos: L.LatLng; icon: L.DivIcon }>>(new Map())
  const liveMarkersRef = useRef<L.Marker[]>([])
  const animRef = useRef<number | null>(null)
  // Fantasmas de la animación EN CURSO — si un recómputo nuevo cancela esa
  // animación a medio camino (p. ej. el doble efecto de StrictMode en
  // desarrollo, o un cambio de categoría mientras aún volaban pines), hay
  // que sacarlos ya mismo: si no, quedan pegados en el mapa para siempre
  // porque su limpieza vivía solo en el "final" de esa animación cancelada.
  const ghostsRef = useRef<L.Marker[]>([])
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const render = useCallback(() => {
    if (animRef.current != null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    ghostsRef.current.forEach(g => map.removeLayer(g))
    ghostsRef.current = []

    liveMarkersRef.current.forEach(m => map.removeLayer(m))
    liveMarkersRef.current = []

    const clusters = clusterSpots(map, spots)
    const newPins = new Map<string, { pos: L.LatLng; icon: L.DivIcon }>()
    const moves: PinMove[] = []
    const ghosts: L.Marker[] = []
    const fadedOrigins = new Set<string>()

    clusters.forEach(cluster => {
      const lead = cluster.spots[0]
      const isGroup = cluster.spots.length > 1
      const selected = !isGroup && lead.id === selectedSpot?.id
      const icon = createPhotoPin(lead.photoUrl, selected, isGroup ? cluster.spots.length : undefined)
      const center = L.latLng(cluster.center[0], cluster.center[1])

      const marker = L.marker(center, { icon }).addTo(map)
      marker.on('click', () => {
        if (!isGroup) {
          onSpotClick(lead)
          return
        }
        // Un solo vuelo hasta encuadrar justo los spots del grupo — mismo
        // gesto que al tocar un cluster en la app nativa.
        const bounds = L.latLngBounds(cluster.spots.map(s => [s.lat, s.lng] as [number, number]))
        map.flyToBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40], maxZoom: 17, duration: 0.75 })
      })
      liveMarkersRef.current.push(marker)

      // De dónde viene este pin: el/los pines donde estaban sus spots en
      // el agrupado anterior.
      const seen = new Set<string>()
      const olds = cluster.spots
        .map(s => lastPinsRef.current.get(s.id))
        .filter((p): p is { pos: L.LatLng; icon: L.DivIcon } => {
          if (!p) return false
          const key = p.pos.toString()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      if (olds.length === 1 && !olds[0].pos.equals(center)) {
        // Un grupo que se abre (o un pin que se reubica): el pin sale
        // volando desde el centro del grupo, y el grupo viejo se
        // desvanece ahí mismo.
        const from = olds[0].pos
        moves.push({ marker, from, to: center })
        const key = from.toString()
        if (!fadedOrigins.has(key)) {
          fadedOrigins.add(key)
          const ghost = L.marker(from, { icon: olds[0].icon, interactive: false }).addTo(map)
          ghosts.push(ghost)
          moves.push({ marker: ghost, from, to: from, fadeOut: true, fast: true })
        }
      } else if (olds.length > 1) {
        // Varios pines que se juntan en un grupo: cada uno vuela hacia el
        // centro y se funde; el grupo aparece.
        moves.push({ marker, from: center, to: center, fadeIn: true })
        olds.forEach(o => {
          if (!o.pos.equals(center)) {
            const ghost = L.marker(o.pos, { icon: o.icon, interactive: false }).addTo(map)
            ghosts.push(ghost)
            moves.push({ marker: ghost, from: o.pos, to: center, fadeOut: true })
          }
        })
      } else if (olds.length === 0 && lastPinsRef.current.size > 0) {
        // Spot que no estaba (p. ej. al cambiar de categoría).
        moves.push({ marker, from: center, to: center, fadeIn: true })
      }

      cluster.spots.forEach(s => newPins.set(s.id, { pos: center, icon }))
    })

    lastPinsRef.current = newPins

    if (moves.length === 0) return

    const start = performance.now()
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / REGROUP_MS)
      const e = overshootEase(raw)
      moves.forEach(m => {
        if (!m.from.equals(m.to)) {
          m.marker.setLatLng([
            m.from.lat + (m.to.lat - m.from.lat) * e,
            m.from.lng + (m.to.lng - m.from.lng) * e,
          ])
        }
        if (m.fadeIn) m.marker.setOpacity(Math.min(1, raw * 1.8))
        else if (m.fadeOut) m.marker.setOpacity(Math.max(0, 1 - raw * (m.fast ? 3.5 : 1.4)))
      })
      if (raw < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        moves.forEach(m => { if (!m.from.equals(m.to)) m.marker.setLatLng(m.to) })
        ghosts.forEach(g => map.removeLayer(g))
        ghostsRef.current = []
        animRef.current = null
      }
    }
    ghostsRef.current = ghosts
    animRef.current = requestAnimationFrame(tick)
  }, [map, spots, selectedSpot, onSpotClick])

  // Un solo gesto de zoom/pan dispara 'moveend' Y 'zoomend' casi en el mismo
  // instante (a veces con pocos milisegundos de diferencia) — cablear los
  // dos directo a render() hacía que el segundo cancelara la animación del
  // primero antes de su primer cuadro (se vio literal en los logs: un
  // render() con 8 movimientos reales, cancelado 4ms después por el otro
  // evento), y el agrupado terminaba saltando a su posición final sin haber
  // animado nada — eso era lo "brusco". Espejo del `postDelayed(settle,
  // MAP_SETTLE_MS)` de SpotsMapView.kt: se espera a que el mapa de verdad
  // se detenga antes de recalcular.
  const scheduleRender = useCallback(() => {
    if (settleTimeoutRef.current != null) clearTimeout(settleTimeoutRef.current)
    settleTimeoutRef.current = setTimeout(() => {
      settleTimeoutRef.current = null
      render()
    }, 90)
  }, [render])

  useEffect(() => { render() }, [render])
  useMapEvents({ moveend: scheduleRender, zoomend: scheduleRender })

  useEffect(() => () => {
    if (settleTimeoutRef.current != null) clearTimeout(settleTimeoutRef.current)
    if (animRef.current != null) cancelAnimationFrame(animRef.current)
    ghostsRef.current.forEach(g => map.removeLayer(g))
    liveMarkersRef.current.forEach(m => map.removeLayer(m))
  }, [map])

  return null
}

function MapControls({ onRecenter }: { onRecenter: () => void }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '25vh',   // ← relativo a la altura del viewport
      right: '5vw',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <button
        onClick={onRecenter}
        className="btn btn-icon"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          width: '44px',
          height: '44px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <Crosshair size={20} color="var(--orange)" />
      </button>
    </div>
  )
}

function MapLogic({ userLat, userLng }: { userLat: number | null, userLng: number | null }) {
  const map = useMap()
  const [hasCentered, setHasCentered] = useState(false)

  // Initial center on user or Piura
  useEffect(() => {
    if (!hasCentered) {
      if (userLat && userLng) {
        map.setView([userLat, userLng], 14, { animate: true })
        setHasCentered(true)
      } else {
        map.setView([PIURA_CENTER.lat, PIURA_CENTER.lng], 12)
      }
    }
  }, [map, userLat, userLng, hasCentered])

  return null
}

export default function MapView() {
  const { filtered, selectedSpot, selectSpot } = useSpotsStore()
  const { lat: userLat, lng: userLng, error: geoError } = useGeolocation()
  const [mapRef, setMapRef] = useState<L.Map | null>(null)

  const handleRecenter = () => {
    if (userLat && userLng && mapRef) {
      mapRef.setView([userLat, userLng], 15, { animate: true })
    } else if (mapRef) {
      mapRef.setView([PIURA_CENTER.lat, PIURA_CENTER.lng], 12, { animate: true })
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[PIURA_CENTER.lat, PIURA_CENTER.lng]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        ref={setMapRef}
        // Girar con dos dedos, igual que DeadZoneRotationOverlay en
        // SpotsMapView.kt — Leaflet no trae esto de fábrica, lo agrega
        // leaflet-rotate. Sin control visible (rotateControl: false): en la
        // app tampoco hay un botón de brújula, es puro gesto.
        {...({ rotate: true, rotateControl: false, touchRotate: true, bearing: 0 } as Record<string, unknown>)}
      >
        {/* CARTO's "light_all" ahora valida el dominio del sitio — fuera de
            donde CARTO lo espera (p. ej. por el túnel de ngrok) devuelve
            mosaicos grises con la marca "API KEY REQUIRED" en vez del mapa.
            Mismo problema que ya se había dado en la app nativa (ver el
            comentario en SpotsMapView.kt): ahí se resolvió usando MAPNIK, el
            estándar de OSM sin API key. El desaturado + aclarado (mismo
            espíritu que mutedTileFilter allá) vive en globals.css junto con
            el fondo del mapa — ahí estaba el verdadero bug: un fondo negro
            con !important que hacía ver el mapa roto en cualquier hueco sin
            mosaico todavía cargado. La opacidad acá deja que ese fondo
            (crema, no negro) se transparente un poco y aclare más el mapa. */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          opacity={0.85}
        />

        <MapLogic userLat={userLat} userLng={userLng} />

        <ClusteredSpotMarkers spots={filtered} selectedSpot={selectedSpot} onSpotClick={selectSpot} />

        {userLat && userLng && (
          <Marker
            position={[userLat, userLng]}
            icon={createUserPin()}
            zIndexOffset={1000}
          />
        )}
      </MapContainer>

      <MapControls onRecenter={handleRecenter} />

      {/* Warning for insecure context or errors */}
      {(!window.isSecureContext && !geoError) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(255,85,0,0.9)',
          padding: '8px 16px',
          borderRadius: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}>
          <ShieldAlert size={14} color="white" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)' }}>
            USA HTTPS PARA VER TU UBICACIÓN
          </span>
        </div>
      )}

    </div>
  )
}
