import { api } from '../wrapper'

export type ServiceItem = {
  id: string | number
  name: string
  slug: string
  description?: string
  body?: string
  bullets_heading?: string
  bullets?: string[]
  meta_title?: string
  meta_description?: string
  short_description?: string
  icon?: string
  image?: string | null
  is_active?: boolean
  sort_order?: number
}

export const servicesApi = {
  list: () => api.get<ServiceItem[]>('/services', { skipAuth: true }),
  get: (slug: string) => api.get<ServiceItem>(`/services/${slug}`, { skipAuth: true }),
}
