import { useState, useEffect, useRef } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeoState>({ lat: null, lng: null, error: null, loading: true })
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalización no disponible', loading: false }))
      return
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => setState((s) => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  return state
}
