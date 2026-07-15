import type { Invoice, Notification, Subscription } from '@/types'
import { api } from '../wrapper'

export type SupportTicketPayload = {
  subject: string
  description: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export type ProfileUpdatePayload = {
  name?: string
  phone?: string
  company_name?: string
}

export const clientApi = {
  dashboard: () => api.get<unknown>('/client/dashboard'),

  purchase: (payload: { product_id: string; plan_id: string; payment_gateway?: string }) =>
    api.post<unknown>('/client/purchase', payload),

  payments: {
    verify: (payload: {
      payment_id: string | number
      razorpay_payment_id: string
      razorpay_order_id: string
      razorpay_signature: string
    }) => api.post<unknown>('/client/payments/verify', payload),
  },

  products: {
    list: () => api.get<unknown[]>('/client/products'),
    get: (slug: string) => api.get<unknown>(`/client/products/${slug}`),
  },

  subscriptions: {
    list: () => api.get<Subscription[]>('/client/subscriptions'),
    get: (id: string | number) => api.get<Subscription>(`/client/subscriptions/${id}`),
    cancel: (id: string | number) => api.post<Subscription>(`/client/subscriptions/${id}/cancel`),
  },

  invoices: {
    list: () => api.get<Invoice[]>('/client/invoices'),
    get: (id: string | number) => api.get<Invoice>(`/client/invoices/${id}`),
    printSource: (id: string | number) => api.get<Blob>(`/client/invoices/${id}/download`, { responseType: 'blob' }),
  },

  notifications: {
    list: () => api.get<Notification[]>('/client/notifications'),
    markRead: (id: string | number) => api.post<null>(`/client/notifications/${id}/read`),
    markAllRead: () => api.post<null>('/client/notifications/read-all'),
  },

  support: {
    list: () => api.get<unknown[]>('/client/support'),
    get: (id: string | number) => api.get<unknown>(`/client/support/${id}`),
    create: (payload: SupportTicketPayload) => api.post<unknown>('/client/support', payload),
    reply: (id: string | number, payload: { message: string }) =>
      api.post<unknown>(`/client/support/${id}/replies`, payload),
  },

  licenses: {
    list: () => api.get<unknown>('/client/licenses'),
    get: (id: string | number) => api.get<unknown>(`/client/licenses/${id}`),
    registerDomain: (id: string | number, payload: { domain: string }) =>
      api.post<unknown>(`/client/licenses/${id}/domains`, payload),
    removeDomain: (id: string | number, payload: { domain: string }) =>
      api.delete<unknown>(`/client/licenses/${id}/domains`, { data: payload }),
    requestDomainReset: (id: string | number, payload?: { reason?: string }) =>
      api.post<unknown>(`/client/licenses/${id}/domain-reset-request`, payload ?? {}),
    activateProduct: (id: string | number) => api.post<unknown>(`/client/licenses/${id}/activate-product`),
    deactivateProduct: (id: string | number) => api.post<unknown>(`/client/licenses/${id}/deactivate-product`),
    activity: (id: string | number) => api.get<unknown>(`/client/licenses/${id}/activity`),
    history: (id: string | number) => api.get<unknown>(`/client/licenses/${id}/history`),
  },

  profile: {
    get: () => api.get<unknown>('/client/profile'),
    update: (payload: ProfileUpdatePayload) => api.put<unknown>('/client/profile', payload),
  },
}
