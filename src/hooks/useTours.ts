import { useState, useCallback } from 'react'
import { toursService } from '../services/tours'
import type { Tour, TourStatus } from '../types/tour'

export const useTours = (churreId: string) => {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await toursService.getTours(churreId)
      setTours(data)
    } catch (e) {
      setError('Error cargando tours')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [churreId])

  const updateStatus = async (id: string, status: TourStatus) => {
    const updated = await toursService.updateTourStatus(id, status)
    setTours((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  return { tours, loading, error, load, updateStatus }
}
