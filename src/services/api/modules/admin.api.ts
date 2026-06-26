import type { HeroSlide, SiteFaq, SiteTestimonial } from '@/types/siteContent'
import { api } from '../wrapper'

export const adminApi = {
  reports: {
    dashboard: (params?: { from?: string; to?: string }) => api.get<unknown>('/admin/reports/dashboard', { params }),
    revenue: (params?: { from?: string; to?: string }) => api.get<unknown>('/admin/reports/revenue', { params }),
    subscriptions: () => api.get<unknown>('/admin/reports/subscriptions'),
    products: () => api.get<unknown>('/admin/reports/products'),
    exportCsv: (params?: { from?: string; to?: string }) =>
      api.get<Blob>('/admin/reports/export', { params, responseType: 'blob' }),
  },

  notifications: {
    list: () => api.get<unknown[]>('/admin/notifications'),
    send: (payload: unknown) => api.post<unknown>('/admin/notifications', payload),
    delete: (id: string | number) => api.delete<null>(`/admin/notifications/${id}`),
  },

  tenants: {
    list: () => api.get<unknown[]>('/admin/tenants'),
    get: (id: string | number) => api.get<unknown>(`/admin/tenants/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/tenants', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/tenants/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/tenants/${id}`),
  },

  users: {
    list: (params?: { role?: string }) => api.get<unknown[]>('/admin/users', { params }),
    create: (payload: unknown) => api.post<unknown>('/admin/users', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/users/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/users/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/users/${id}`),
  },

  productCategories: {
    list: () => api.get<unknown[]>('/admin/product-categories'),
    get: (id: string | number) => api.get<unknown>(`/admin/product-categories/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/product-categories', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/product-categories/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/product-categories/${id}`),
  },

  products: {
    list: () => api.get<unknown[]>('/admin/products'),
    create: (payload: unknown) => api.post<unknown>('/admin/products', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/products/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/products/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/products/${id}`),
  },

  plans: {
    list: () => api.get<unknown[]>('/admin/plans'),
    create: (payload: unknown) => api.post<unknown>('/admin/plans', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/plans/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/plans/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/plans/${id}`),
  },

  services: {
    list: () => api.get<unknown[]>('/admin/services'),
    create: (payload: unknown) => api.post<unknown>('/admin/services', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/services/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/services/${id}`),
  },

  subscriptions: {
    list: () => api.get<unknown[]>('/admin/subscriptions'),
    create: (payload: unknown) => api.post<unknown>('/admin/subscriptions', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/subscriptions/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/subscriptions/${id}`, payload),
    cancel: (id: string | number) => api.post<unknown>(`/admin/subscriptions/${id}/cancel`),
    delete: (id: string | number) => api.delete<null>(`/admin/subscriptions/${id}`),
  },

  orders: {
    list: () => api.get<unknown[]>('/admin/orders'),
    get: (id: string | number) => api.get<unknown>(`/admin/orders/${id}`),
    delete: (id: string | number) => api.delete<null>(`/admin/orders/${id}`),
  },

  invoices: {
    list: () => api.get<unknown[]>('/admin/invoices'),
    get: (id: string | number) => api.get<unknown>(`/admin/invoices/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/invoices/${id}`, payload),
    download: (id: string | number) => api.get<Blob>(`/admin/invoices/${id}/download`, { responseType: 'blob' }),
    delete: (id: string | number) => api.delete<null>(`/admin/invoices/${id}`),
  },

  payments: {
    list: () => api.get<unknown[]>('/admin/payments'),
    get: (id: string | number) => api.get<unknown>(`/admin/payments/${id}`),
    delete: (id: string | number) => api.delete<null>(`/admin/payments/${id}`),
  },

  supportTickets: {
    list: () => api.get<unknown[]>('/admin/support-tickets'),
    get: (id: string | number) => api.get<unknown>(`/admin/support-tickets/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/support-tickets/${id}`, payload),
    reply: (id: string | number, payload: { message: string; is_internal?: boolean }) =>
      api.post<unknown>(`/admin/support-tickets/${id}/replies`, payload),
  },

  blogs: {
    list: () => api.get<unknown[]>('/admin/blogs'),
    create: (payload: unknown) => api.post<unknown>('/admin/blogs', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/blogs/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/blogs/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/blogs/${id}`),
  },

  testimonials: {
    list: () => api.get<SiteTestimonial[]>('/admin/testimonials'),
    create: (payload: unknown) => api.post<SiteTestimonial>('/admin/testimonials', payload),
    update: (id: string | number, payload: unknown) => api.put<SiteTestimonial>(`/admin/testimonials/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/testimonials/${id}`),
  },

  heroSlides: {
    list: () => api.get<HeroSlide[]>('/admin/hero-slides'),
    create: (payload: unknown) => api.post<HeroSlide>('/admin/hero-slides', payload),
    update: (id: string | number, payload: unknown) => api.put<HeroSlide>(`/admin/hero-slides/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/hero-slides/${id}`),
  },

  uploads: {
    create: (formData: FormData) =>
      api.post<{ path: string; url?: string }>('/admin/uploads', formData),
  },

  faqs: {
    list: () => api.get<SiteFaq[]>('/admin/faqs'),
    create: (payload: unknown) => api.post<SiteFaq>('/admin/faqs', payload),
    update: (id: string | number, payload: unknown) => api.put<SiteFaq>(`/admin/faqs/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/faqs/${id}`),
  },

  contactMessages: {
    list: () => api.get<unknown[]>('/admin/contact-messages'),
    get: (id: string | number) => api.get<unknown>(`/admin/contact-messages/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/contact-messages/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/contact-messages/${id}`),
  },

  settings: {
    list: (params?: { group?: string }) => api.get<unknown[]>('/admin/settings', { params }),
    create: (payload: unknown) => api.post<unknown>('/admin/settings', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/settings/${id}`, payload),
    bulkUpdate: (payload: { settings: Array<{ key: string; value?: string; group?: string }> }) =>
      api.post<null>('/admin/settings/bulk', payload),
    delete: (id: string | number) => api.delete<null>(`/admin/settings/${id}`),
  },

  integrations: {
    list: () => api.get<unknown[]>('/admin/integrations'),
    create: (payload: unknown) => api.post<unknown>('/admin/integrations', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/integrations/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/integrations/${id}`),
    sendTestEmail: (id: string | number, payload: { to?: string; credentials?: Record<string, string> }) =>
      api.post<null>(`/admin/integrations/${id}/test-email`, payload),
  },
}
