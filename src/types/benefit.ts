export interface SpotBenefit {
  id: string
  spotId: string | null
  type: string
  title: string
  description: string
  code: string | null
  discountPct: number | null
  validUntil: string | null
  active: boolean
}
