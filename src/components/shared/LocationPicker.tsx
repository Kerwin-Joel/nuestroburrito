import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { ClipboardPaste } from 'lucide-react'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#FF8C00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid rgba(255,85,0,0.4);box-shadow:0 4px 12px rgba(255,85,0,0.4);"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28],
})

/**
 * Saca "lat, lng" de lo que el admin pegue: coordenadas sueltas
 * ("-5.19, -80.63") o un link de Google Maps (".../@-5.19,-80.63,17z"
 * o "...?q=-5.19,-80.63").
 */
export function parseCoordinates(text: string): { lat: number; lng: number } | null {
  const t = text.trim()
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,                 // .../@lat,lng,17z
    /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,                 // data=!3dlat!4dlng
    /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/,         // lat, lng
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
    }
  }
  return null
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FollowPoint({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  // El mapa se monta dentro de un modal animado: sin esto queda a medio pintar.
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 150); return () => clearTimeout(t) }, [map])
  useEffect(() => {
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], Math.max(map.getZoom(), 15))
  }, [lat, lng, map])
  return null
}

interface Props {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState(false)
  const valid = Number.isFinite(lat) && Number.isFinite(lng)
  const center: [number, number] = valid ? [lat, lng] : [-5.1945, -80.6328]

  const applyPaste = (text: string) => {
    const c = parseCoordinates(text)
    if (c) {
      onChange(round(c.lat), round(c.lng))
      setPaste('')
      setPasteError(false)
    } else {
      setPasteError(text.trim().length > 0)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        <ClipboardPaste size={14} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={paste}
          onChange={e => { setPaste(e.target.value); setPasteError(false) }}
          onPaste={e => { const t = e.clipboardData.getData('text'); setTimeout(() => applyPaste(t), 0) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPaste(paste) } }}
          placeholder="Pega un link de Google Maps o “-5.19, -80.63”"
          className="input"
          style={{
            background: 'var(--card2)', border: `1px solid ${pasteError ? '#ef4444' : 'var(--border)'}`,
            borderRadius: '10px', color: 'var(--white)', fontFamily: 'var(--font-body)',
            fontSize: '13px', padding: '10px 14px 10px 34px', width: '100%', outline: 'none',
          }}
        />
        {pasteError && <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>No encontré coordenadas en ese texto</p>}
      </div>

      <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <ClickToPlace onPick={(a, b) => onChange(round(a), round(b))} />
          <FollowPoint lat={center[0]} lng={center[1]} />
          {valid && (
            <Marker
              position={center}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: e => {
                  const p = (e.target as L.Marker).getLatLng()
                  onChange(round(p.lat), round(p.lng))
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
        Toca el mapa o arrastra el pin para ajustar el punto exacto.
      </p>
    </div>
  )
}
