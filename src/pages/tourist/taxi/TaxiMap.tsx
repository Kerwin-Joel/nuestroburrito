import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { ClusteredSpotMarkers } from '../../../components/shared/MapView'
import { PIURA_CENTER } from '../../../lib/constants'
import type { Spot } from '../../../types/spot'
import type { GeoPoint } from '../../../services/taxi'

/*
 * Mapa del taxi — espejo de TaxiMap.kt / MapBurrito.kt de la app nativa:
 * ruta real por calles (borde blanco + línea oscura), recojo (círculo verde)
 * y destino (cuadrado negro) con su etiqueta, spots con foto tocables, pulso
 * mientras se busca conductor y los autos como Burrito Chevy 3D que corre al
 * avanzar y mira alrededor cuando se detiene.
 */

export interface CarPin { at: GeoPoint }
export interface BurritoPin { key: string; at: GeoPoint; heading: number | null; moving: boolean; hero?: boolean }

export interface TaxiMapContent {
  me: GeoPoint | null
  pickup?: GeoPoint | null
  pickupLabel?: string | null
  dropoff?: GeoPoint | null
  dropoffLabel?: string | null
  cars?: CarPin[]
  burritos?: BurritoPin[]
  spots?: Spot[]
  /** Respaldo si no hay ruta por calles: línea recta punteada. */
  route?: [GeoPoint, GeoPoint] | null
  routePath?: GeoPoint[]
  pulseAt?: GeoPoint | null
  /** Cuando cambia, la cámara se reencuadra sobre cameraPoints. */
  cameraKey: string
  cameraPoints: GeoPoint[]
}

/** Más de esto en 3D pesa demasiado (cada uno es su propia escena WebGL). */
export const MAX_3D_BURRITOS = 4

const ll = (p: GeoPoint) => L.latLng(p.lat, p.lng)
const INK = '#1A120A'

function endpointIcon(label: string | null | undefined, pickup: boolean) {
  const text = label ? (label.length > 26 ? `${label.slice(0, 24)}…` : label) : null
  const pin = pickup
    ? `<div style="width:22px;height:22px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center"><div style="width:18px;height:18px;border-radius:50%;background:#2E9E5B;display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:#fff"></div></div></div>`
    : `<div style="width:22px;height:22px;border-radius:5px;background:#fff;display:flex;align-items:center;justify-content:center"><div style="width:18px;height:18px;border-radius:4px;background:${INK};display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:1.5px;background:#fff"></div></div></div>`
  const bubble = text
    ? `<div style="position:relative;background:${INK};color:#fff;font:700 12.5px var(--font-body),sans-serif;padding:6px 11px;border-radius:14px;white-space:nowrap;margin-bottom:8px">${text.replace(/</g, '&lt;')}<div style="position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-top-color:${INK};border-bottom:0"></div></div>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:absolute;bottom:0;left:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))">${bubble}${pin}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, -11],
  })
}

const meIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;border-radius:50%;background:rgba(77,174,255,.2);display:flex;align-items:center;justify-content:center"><div style="width:18px;height:18px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.25)"><div style="width:13px;height:13px;border-radius:50%;background:#2F8FEA"></div></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

const carIcon = L.divIcon({
  className: 'burrito-pin',
  html: '<div style="width:38px;height:38px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center"><img src="/isotipo_burrito.png" style="width:32px;height:32px;object-fit:contain" alt=""/></div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

const pulseIcon = L.divIcon({
  className: '',
  html: '<div class="tx-pulse"><span></span><span></span><span></span></div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

export default function TaxiMap({ content, sheetHeight, topInset, recenterSignal, onLongPress, onSpotTap }: {
  content: TaxiMapContent
  sheetHeight: number
  topInset: number
  recenterSignal: number
  onLongPress: (p: GeoPoint) => void
  onSpotTap: (spot: Spot) => void
}) {
  return (
    <MapContainer
      center={[PIURA_CENTER.lat, PIURA_CENTER.lng]} zoom={14} zoomControl={false} attributionControl={false}
      style={{ position: 'absolute', inset: 0 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.85} />
      <Camera content={content} sheetHeight={sheetHeight} topInset={topInset} recenterSignal={recenterSignal} />
      <LongPress onLongPress={onLongPress} />

      {content.spots && content.spots.length > 0 && (
        <ClusteredSpotMarkers spots={content.spots} selectedSpot={null} onSpotClick={onSpotTap} />
      )}

      {content.routePath && content.routePath.length >= 2 ? (
        <>
          <Polyline positions={content.routePath.map(ll)} pathOptions={{ color: '#fff', weight: 9, lineCap: 'round', lineJoin: 'round', opacity: 1 }} interactive={false} />
          <Polyline positions={content.routePath.map(ll)} pathOptions={{ color: INK, weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 1 }} interactive={false} />
        </>
      ) : content.route ? (
        <Polyline positions={content.route.map(ll)} pathOptions={{ color: INK, weight: 4, opacity: 0.6, dashArray: '9 7' }} interactive={false} />
      ) : null}

      {content.pulseAt && <Marker position={ll(content.pulseAt)} icon={pulseIcon} interactive={false} />}
      {content.cars?.map((c, i) => <Marker key={`car-${i}`} position={ll(c.at)} icon={carIcon} interactive={false} />)}
      {content.pickup && <Marker position={ll(content.pickup)} icon={endpointIcon(content.pickupLabel, true)} interactive={false} zIndexOffset={800} />}
      {content.dropoff && <Marker position={ll(content.dropoff)} icon={endpointIcon(content.dropoffLabel, false)} interactive={false} zIndexOffset={800} />}
      {content.me && <Marker position={ll(content.me)} icon={meIcon} interactive={false} zIndexOffset={900} />}

      {(content.burritos ?? []).slice(0, MAX_3D_BURRITOS + 1).map(b => <FloatingBurrito key={b.key} b={b} />)}
    </MapContainer>
  )
}

/** Mantener presionado (o clic derecho en la computadora): destino libre. */
function LongPress({ onLongPress }: { onLongPress: (p: GeoPoint) => void }) {
  useMapEvents({ contextmenu: e => onLongPress({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/**
 * Cámara: solo cuando cambia la "escena" (no en cada movimiento del auto), y
 * esperando a que el panel termine de cambiar de tamaño — un solo vuelo.
 * La ruta tiene que caber en la franja visible entre la barra de arriba y el panel.
 */
function Camera({ content, sheetHeight, topInset, recenterSignal }: {
  content: TaxiMapContent; sheetHeight: number; topInset: number; recenterSignal: number
}) {
  const map = useMap()
  const latest = useRef({ content, sheetHeight, topInset })
  useLayoutEffect(() => { latest.current = { content, sheetHeight, topInset } })

  const frame = (points: GeoPoint[]) => {
    if (!points.length) return
    const { sheetHeight: sh, topInset: ti } = latest.current
    const lats = points.map(p => p.lat)
    const lngs = points.map(p => p.lng)
    // Un solo punto también pasa por aquí: la caja mínima (~450 m) equivale a un zoom de barrio.
    const midLat = (Math.max(...lats) + Math.min(...lats)) / 2
    const midLng = (Math.max(...lngs) + Math.min(...lngs)) / 2
    const halfLat = Math.max(Math.max(...lats) - Math.min(...lats), 0.004) / 2
    const halfLng = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.004) / 2
    const bounds = L.latLngBounds([midLat - halfLat, midLng - halfLng], [midLat + halfLat, midLng + halfLng])
    map.flyToBounds(bounds, {
      paddingTopLeft: [40, ti + 30],
      paddingBottomRight: [40, sh + 30],
      maxZoom: 17,
      duration: 0.7,
    })
  }

  useEffect(() => {
    const t = setTimeout(() => frame(latest.current.content.cameraPoints), 280)
    return () => clearTimeout(t)
  }, [content.cameraKey, sheetHeight > 0, topInset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recenterSignal > 0 && latest.current.content.me) frame([latest.current.content.me])
  }, [recenterSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ── Burrito 3D anclado a su coordenada ───────────────────────────────────────

// Orientaciones del modelo vistas desde la cámara fija de burrito.js:
// tres cuartos hacia la derecha o hacia la izquierda de la pantalla.
const FACE_RIGHT = 0.17
const FACE_LEFT = -1.4

type BurritoWindow = Window & { burrito?: { play: (a: string) => void; face?: (a: number) => void } }

/** Un burrito que sigue a su coordenada en pantalla y se desliza entre puntos GPS. */
function FloatingBurrito({ b }: { b: BurritoPin }) {
  const map = useMap()
  const size = b.hero ? 92 : 70
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const anim = useRef({ from: b.at, to: b.at, start: 0, raf: 0 })

  // Posición en pantalla: se recalcula al mover el mapa y en cada cuadro del deslizamiento.
  const place = useMemo(() => () => {
    const a = anim.current
    const t = a.start ? Math.min(1, (performance.now() - a.start) / 2800) : 1
    const p = { lat: a.from.lat + (a.to.lat - a.from.lat) * t, lng: a.from.lng + (a.to.lng - a.from.lng) * t }
    const pt = map.latLngToContainerPoint([p.lat, p.lng])
    // El ancla son las patas: el burrito "pisa" su coordenada.
    if (box.current) box.current.style.transform = `translate(${pt.x - size / 2}px, ${pt.y - size * 0.78}px)`
    return t
  }, [map, size])

  useEffect(() => {
    const a = anim.current
    if (a.to.lat === b.at.lat && a.to.lng === b.at.lng) { place(); return }
    // Más o menos lo que tarda en llegar el siguiente punto GPS: avanza sin saltos.
    const t = a.start ? Math.min(1, (performance.now() - a.start) / 2800) : 1
    a.from = { lat: a.from.lat + (a.to.lat - a.from.lat) * t, lng: a.from.lng + (a.to.lng - a.from.lng) * t }
    a.to = b.at
    a.start = performance.now()
    cancelAnimationFrame(a.raf)
    const tick = () => { if (place() < 1) a.raf = requestAnimationFrame(tick) }
    a.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(a.raf)
  }, [b.at, place])

  useEffect(() => {
    map.on('move zoom viewreset', place)
    place()
    return () => { map.off('move zoom viewreset', place) }
  }, [map, place])

  // Listo cuando pinta el primer cuadro (o a los 2.5 s, por si el aviso no llega).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && (e.data as { type?: string })?.type === 'burrito-ready') setReady(true)
    }
    window.addEventListener('message', onMsg)
    const t = setTimeout(() => setReady(true), 2500)
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t) }
  }, [])

  // Corre si avanza, mira si está parado; gira hacia el lado al que va.
  useEffect(() => {
    if (!ready) return
    const w = frame.current?.contentWindow as BurritoWindow | null
    w?.burrito?.play(b.moving ? 'run' : 'look')
  }, [ready, b.moving])
  useEffect(() => {
    if (!ready || b.heading == null) return
    const w = frame.current?.contentWindow as BurritoWindow | null
    // Rumbo 0–180° = va hacia el este (derecha del mapa, que tiene el norte arriba).
    w?.burrito?.face?.(b.heading >= 0 && b.heading <= 180 ? FACE_RIGHT : FACE_LEFT)
  }, [ready, b.heading])

  return (
    <BurritoPortal pane={map.getContainer()}>
      <div ref={box} style={{
        position: 'absolute', left: 0, top: 0, width: size, height: size, zIndex: 650, pointerEvents: 'none',
        opacity: ready ? 1 : 0, transition: 'opacity .35s',
      }}>
        <iframe
          ref={frame} title="Burrito" src="/burrito/index.html?v=B&a=look" tabIndex={-1} aria-hidden
          style={{ width: '100%', height: '100%', border: 0, background: 'transparent', pointerEvents: 'none' }}
        />
      </div>
    </BurritoPortal>
  )
}

function BurritoPortal({ pane, children }: { pane: HTMLElement; children: React.ReactNode }) {
  return createPortal(children, pane)
}
