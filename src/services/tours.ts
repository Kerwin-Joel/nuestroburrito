import { MOCK_DELAY_MS } from '../lib/constants'
import { MOCK_TOURS } from '../lib/mockData'
import type { Tour, TourStatus } from '../types/tour'

const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY_MS))

export const toursService = {
  async getTours(churreId: string): Promise<Tour[]> {
    await delay()
    return MOCK_TOURS.filter((t) => t.churreId === churreId)
  },

  async updateTourStatus(id: string, status: TourStatus): Promise<Tour> {
    await delay()
    const tour = MOCK_TOURS.find((t) => t.id === id)
    if (!tour) throw new Error(`Tour ${id} not found`)
    return { ...tour, status }
  },
}
