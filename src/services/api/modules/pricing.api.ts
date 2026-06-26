import { api } from '../wrapper'

export type PricingPlan = {
  id: string | number
  name: string
  slug?: string
  price_monthly?: number
  price_yearly?: number
  features?: string[]
}

export const pricingApi = {
  list: () => api.get<PricingPlan[]>('/pricing'),
}
