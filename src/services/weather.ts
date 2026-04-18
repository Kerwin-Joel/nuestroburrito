import { MOCK_WEATHER } from '../lib/mockData'
import { FEATURES, MOCK_DELAY_MS } from '../lib/constants'

const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

export interface WeatherData {
  temp: number
  condition: string
  emoji: string
  humidity: number
  windSpeed: number
  tip: string
}

export const weatherService = {
  async getPiuraWeather(): Promise<WeatherData> {
    await delay()
    if (FEATURES.REAL_WEATHER) {
      // TODO: OpenWeather API
      throw new Error('Weather API not configured yet')
    }
    return MOCK_WEATHER
  },
}
