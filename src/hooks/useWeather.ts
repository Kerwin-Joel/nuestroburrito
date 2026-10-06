import { useState, useCallback } from 'react'
import { weatherService, type WeatherData } from '../services/weather'

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await weatherService.getPiuraWeather()
      setWeather(data)
    } finally {
      setLoading(false)
    }
  }, [])

  return { weather, loading, load }
}
