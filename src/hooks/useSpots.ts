import { useState, useCallback, useEffect } from 'react'
import { spotsService } from '../services/spots'
import { useSpotsStore } from '../stores/useSpotsStore'
import { FEATURES } from '../lib/constants'
import type { Spot } from '../types/spot'

export const useSpots = () => {
  const { spots, filtered, activeCategory, setSpots, setCategory, selectSpot, selectedSpot } = useSpotsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    // ← quita el guard de caché por ahora
    setLoading(true)
    try {
      const data = await spotsService.getSpots()
      setSpots(data)
    } catch (e) {
      setError('No se pudieron cargar los spots')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [setSpots])

  useEffect(() => {
    if (!FEATURES.REAL_AUTH) return

    const subscription = spotsService.subscribeToSpots((updatedSpots) => {
      setSpots(updatedSpots)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSpots])

  const getDistance = (spot: Spot, userLat?: number, userLng?: number): number | null => {
    if (!userLat || !userLng) return null
    const R = 6371000
    const dLat = ((spot.lat - userLat) * Math.PI) / 180
    const dLng = ((spot.lng - userLng) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((spot.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return { spots, filtered, activeCategory, selectedSpot, loading, error, load, setCategory, selectSpot, getDistance }
}
