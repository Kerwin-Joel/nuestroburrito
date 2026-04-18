import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Crosshair, ShieldAlert } from 'lucide-react'
import { useSpotsStore } from '../../stores/useSpotsStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { PIURA_CENTER } from '../../lib/constants'
import type { Spot } from '../../types/spot'

// Custom orange pin SVG marker for spots
const createOrangePin = (selected = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${selected ? 36 : 28}px;
    height:${selected ? 36 : 28}px;
    background:${selected ? '#FF5500' : '#FF8C00'};
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid ${selected ? '#FDFAF4' : 'rgba(255,85,0,0.4)'};
    box-shadow:0 ${selected ? 8 : 4}px ${selected ? 24 : 12}px rgba(255,85,0,${selected ? '0.6' : '0.4'});
    transition:all 0.2s;
  "></div>`,
  iconSize: [selected ? 36 : 28, selected ? 36 : 28],
  iconAnchor: [selected ? 18 : 14, selected ? 36 : 28],
})

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

function MapControls({ onRecenter }: { onRecenter: () => void }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '154px',
      right: '24px',
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
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />

        <MapLogic userLat={userLat} userLng={userLng} />

        {filtered.map((spot: Spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={createOrangePin(selectedSpot?.id === spot.id)}
            eventHandlers={{ click: () => selectSpot(spot) }}
          />
        ))}

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
