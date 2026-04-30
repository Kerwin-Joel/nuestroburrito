import { FEATURES, MOCK_DELAY_MS } from '../lib/constants'
import type { Itinerary } from '../types/itinerary'

const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

export const whatsappService = {
  async sendItinerary(phone: string | null, itinerary: Itinerary): Promise<void> {
    await delay()

    const text = `🫔 *${itinerary.title}*\n\n` +
      itinerary.stops.map((s, i) =>
        `${i + 1}. *${s.time}* — ${s.spotName}${s.localTip ? `\n   💡 ${s.localTip}` : ''}`
      ).join('\n\n') +
      `\n\n_Generado con Burrito · La guía piurana_ 🫏`

    // Si hay número → wa.me/número, si no → wa.me (usuario elige)
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`

    window.open(url, '_blank')
  },
}
