import { api } from '../wrapper'

export type ServiceItem = {
  id: string | number
  name: string
  slug: string
  description?: string
  short_description?: string
  icon?: string
  is_active?: boolean
}

export const servicesApi = {
  list: () => api.get<ServiceItem[]>('/services'),
  get: (slug: string) => api.get<ServiceItem>(`/services/${slug}`),
}
