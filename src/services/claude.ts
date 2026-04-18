import { FEATURES, MOCK_DELAY_MS } from '../lib/constants'
import { MOCK_ITINERARY } from '../lib/mockData'
import type { Itinerary, ItineraryPreferences } from '../types/itinerary'

const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

export const claudeService = {
  async generateItinerary(prefs: ItineraryPreferences): Promise<Itinerary> {
    await delay()
    if (FEATURES.AI_ITINERARY) {
      // TODO: call Claude Sonnet API
      throw new Error('Claude API not configured yet')
    }
    // Return mock itinerary (demo)
    return {
      ...MOCK_ITINERARY,
      id: `itinerary-${Date.now()}`,
      preferences: prefs,
      createdAt: new Date().toISOString(),
    }
  },
}
