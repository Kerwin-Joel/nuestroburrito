import { FEATURES, MOCK_DELAY_MS } from '../lib/constants'
import { MOCK_WEATHER } from '../lib/mockData'

const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

export interface WeatherData {
  temp: number
  condition: string
  emoji: string
  humidity: number
  windSpeed: number
  tip: string
}

// Coordenadas de Piura
const PIURA_LAT = -5.1945
const PIURA_LNG = -80.6328

function parseWeather(code: number, isDay: boolean): { condition: string; emoji: string; tip: string } {
  if (code === 0) return { condition: 'Despejado', emoji: isDay ? '☀️' : '🌙', tip: 'Perfecto para salir — lleva protector solar' }
  if (code <= 3) return { condition: 'Parcialmente nublado', emoji: '⛅', tip: 'Buen día para explorar la ciudad' }
  if (code <= 48) return { condition: 'Nublado', emoji: '☁️', tip: 'Día fresco, ideal para Catacaos' }
  if (code <= 67) return { condition: 'Lluvia', emoji: '🌧️', tip: 'Lleva paraguas — buen día para museos' }
  if (code <= 77) return { condition: 'Aguanieve', emoji: '🌨️', tip: 'Clima inusual para Piura' }
  if (code <= 82) return { condition: 'Chubascos', emoji: '⛈️', tip: 'Mejor quedarse en el restaurante' }
  return { condition: 'Tormenta', emoji: '🌩️', tip: 'Evita salir — buen momento para un cebiche' }
}

export const weatherService = {
  async getPiuraWeather(): Promise<WeatherData> {
    await delay();
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${PIURA_LAT}&longitude=${PIURA_LNG}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&wind_speed_unit=kmh&forecast_days=1`
      )
      const data = await res.json()
      console.log(data)
      const c = data.current
      const { condition, emoji, tip } = parseWeather(c.weather_code, c.is_day === 1)

      return {
        temp: Math.round(c.temperature_2m),
        condition,
        emoji,
        humidity: c.relative_humidity_2m,
        windSpeed: Math.round(c.wind_speed_10m),
        tip,
      }
    } catch {
      await delay()
      return MOCK_WEATHER
    }
  },
}