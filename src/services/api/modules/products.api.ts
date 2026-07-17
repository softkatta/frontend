import type { Product } from '@/types'
import { api } from '../wrapper'

export type PurchasePayload = {
  product_id: string
  plan_id: string
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  company_name?: string
  payment_gateway?: string
}

export const productsApi = {
  list: () => api.get<Product[]>('/products', { skipAuth: true }),
  get: (slug: string) => api.get<Product>(`/products/${slug}`, { skipAuth: true }),
  purchase: (payload: PurchasePayload) => api.post<unknown>('/purchase', payload, { skipAuth: true }),
}
