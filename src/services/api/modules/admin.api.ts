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
    pendingDomains: () => api.get<unknown[]>('/admin/tenants/pending-domains'),
    approvePendingDomain: (tenantId: string | number, subscriptionId: string | number) =>
      api.post<unknown>(`/admin/tenants/${tenantId}/pending-domains/${subscriptionId}/approve`),
    rejectPendingDomain: (tenantId: string | number, subscriptionId: string | number, payload?: { reason?: string }) =>
      api.post<unknown>(`/admin/tenants/${tenantId}/pending-domains/${subscriptionId}/reject`, payload ?? {}),
  },

  users: {
    list: (params?: {
      role?: string
      staff_role?: string
      internal?: boolean
      all?: boolean
      staff_directory?: boolean
      customers_only?: boolean
      exclude_role?: string
      search?: string
      page?: number
      per_page?: number
      is_active?: boolean | string
    }) => api.get<unknown[]>('/admin/users', { params }),
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
    list: (params?: { product_id?: string | number; per_page?: number; page?: number }) =>
      api.get<unknown[]>('/admin/plans', { params }),
    create: (payload: unknown) => api.post<unknown>('/admin/plans', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/plans/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/plans/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/plans/${id}`),
  },

  coupons: {
    list: () => api.get<unknown[]>('/admin/coupons'),
    create: (payload: unknown) => api.post<unknown>('/admin/coupons', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/coupons/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/coupons/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/coupons/${id}`),
  },

  services: {
    list: () => api.get<unknown[]>('/admin/services'),
    create: (payload: unknown) => api.post<unknown>('/admin/services', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/services/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/services/${id}`),
  },

  subscriptions: {
    list: (params?: { user_id?: string | number; per_page?: number; page?: number }) =>
      api.get<unknown[]>('/admin/subscriptions', { params }),
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
    printSource: (id: string | number) => api.get<Blob>(`/admin/invoices/${id}/download`, { responseType: 'blob' }),
    delete: (id: string | number) => api.delete<null>(`/admin/invoices/${id}`),
  },

  payments: {
    list: () => api.get<unknown[]>('/admin/payments'),
    get: (id: string | number) => api.get<unknown>(`/admin/payments/${id}`),
    record: (payload: {
      invoice_id?: string
      order_id?: string
      subscription_id?: string
      payment_id?: string
      payment_method: 'cash' | 'cheque'
      reference?: string
      notes?: string
      paid_at?: string
    }) => api.post<unknown>('/admin/payments/record', payload),
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

  careers: {
    list: () => api.get<unknown[]>('/admin/careers'),
    create: (payload: unknown) => api.post<unknown>('/admin/careers', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/careers/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/careers/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/careers/${id}`),
  },

  companyRoles: {
    list: (params?: { active_only?: boolean; category?: string }) =>
      api.get<unknown[]>('/admin/company-roles', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/company-roles/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/company-roles', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/company-roles/${id}`, payload),
    updateMenus: (id: string | number, payload: { employee_portal_menus: string[] | null }) =>
      api.put<unknown>(`/admin/company-roles/${id}/menus`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/company-roles/${id}`),
  },

  portalMenus: {
    list: (params?: { portal?: string; active_only?: boolean }) =>
      api.get<unknown[]>('/admin/portal-menus', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/portal-menus/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/portal-menus', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/portal-menus/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/portal-menus/${id}`),
  },

  announcements: {
    list: (params?: { published?: boolean }) =>
      api.get<unknown>('/admin/announcements', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/announcements/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/announcements', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/announcements/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/announcements/${id}`),
  },

  assets: {
    list: (params?: { status?: string; category?: string; assigned_to?: string | number; search?: string }) =>
      api.get<unknown>('/admin/assets', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/assets/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/assets', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/assets/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/assets/${id}`),
  },

  training: {
    list: (params?: { status?: string; assigned_to?: string | number; search?: string }) =>
      api.get<unknown>('/admin/training', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/training/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/training', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/training/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/training/${id}`),
  },

  performance: {
    list: (params?: { status?: string; employee_id?: string | number; search?: string }) =>
      api.get<unknown>('/admin/performance', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/performance/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/performance', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/performance/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/performance/${id}`),
  },

  helpdesk: {
    list: (params?: { status?: string; priority?: string; search?: string }) =>
      api.get<unknown>('/admin/helpdesk', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/helpdesk/${id}`),
    create: (payload: unknown) => api.post<unknown>('/admin/helpdesk', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/helpdesk/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/helpdesk/${id}`),
  },

  accessRoles: {
    list: () => api.get<unknown>('/admin/access-roles'),
    sync: () => api.post<unknown>('/admin/access-roles/sync'),
    update: (role: string, payload: { permissions: string[] }) =>
      api.put<unknown>(`/admin/access-roles/${role}`, payload),
  },

  hrManagers: {
    create: (payload: { name: string; email: string; password: string; phone?: string }) =>
      api.post<unknown>('/admin/hr-managers', payload),
  },

  jobApplications: {
    list: (params?: { career_id?: string | number; status?: string; search?: string; sort?: string; direction?: string }) =>
      api.get<unknown[]>('/admin/job-applications', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/job-applications/${id}`),
    update: (id: string | number, payload: { status: string; hr_remarks?: string; interview_scheduled_at?: string }) =>
      api.put<unknown>(`/admin/job-applications/${id}`, payload),
    convertEmployee: (id: string | number, payload: unknown) =>
      api.post<unknown>(`/admin/job-applications/${id}/convert-employee`, payload),
    downloadDocument: (applicationId: string | number, documentId: string | number) =>
      api.get<{ download_url: string; original_name: string }>(`/admin/job-applications/${applicationId}/documents/${documentId}/download`),
    export: (params?: { format?: 'csv' | 'pdf'; status?: string }) =>
      api.get<Blob>('/admin/job-applications/export', { params, responseType: 'blob' }),
    delete: (id: string | number) => api.delete<null>(`/admin/job-applications/${id}`),
  },

  employees: {
    list: (params?: { status?: string; search?: string }) => api.get<unknown[]>('/admin/employees', { params }),
    create: (payload: unknown) => api.post<unknown>('/admin/employees', payload),
    get: (id: string | number) => api.get<unknown>(`/admin/employees/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/employees/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/employees/${id}`),
    downloadIdCard: (id: string | number) =>
      api.get<Blob>(`/admin/employees/${id}/id-card`, { responseType: 'blob' }),
    exportIdCards: (params?: { status?: string }) =>
      api.get<Blob>('/admin/employees/id-cards', { params, responseType: 'blob' }),
    uploadDocument: (id: string | number, formData: FormData) =>
      api.post<unknown>(`/admin/employees/${id}/documents`, formData),
    downloadDocument: (employeeId: string | number, documentId: string | number) =>
      api.get<{ download_url: string; original_name: string }>(`/admin/employees/${employeeId}/documents/${documentId}/download`),
    initiateExit: (id: string | number, payload: unknown) => api.post<unknown>(`/admin/employees/${id}/exit`, payload),
    updateExit: (id: string | number, payload: unknown) => api.patch<unknown>(`/admin/employees/${id}/exit`, payload),
    uploadExitDocument: (id: string | number, formData: FormData) =>
      api.post<unknown>(`/admin/employees/${id}/exit-documents`, formData),
    provisionPortal: (id: string | number, payload?: { portal_email?: string }) =>
      api.post<unknown>(`/admin/employees/${id}/portal-access`, payload ?? {}),
    resendPortalLogin: (id: string | number) =>
      api.post<unknown>(`/admin/employees/${id}/resend-portal-login`),
    sendPortalLogin: (
      id: string | number,
      payload: { channel: 'email' | 'whatsapp' | 'both'; portal_email?: string },
    ) => api.post<unknown>(`/admin/employees/${id}/send-portal-login`, payload),
  },

  leaveRequests: {
    list: (params?: { status?: string; search?: string }) => api.get<unknown[]>('/admin/leave-requests', { params }),
    update: (id: string | number, payload: { status: string; hr_remarks?: string }) =>
      api.patch<unknown>(`/admin/leave-requests/${id}`, payload),
  },

  attendanceRecords: {
    list: (params?: { status?: string; month?: string }) => api.get<unknown[]>('/admin/attendance-records', { params }),
    update: (id: string | number, payload: { status: string; hr_remarks?: string }) =>
      api.patch<unknown>(`/admin/attendance-records/${id}`, payload),
  },

  testimonials: {
    list: () => api.get<SiteTestimonial[]>('/admin/testimonials'),
    create: (payload: unknown) => api.post<SiteTestimonial>('/admin/testimonials', payload),
    update: (id: string | number, payload: unknown) => api.put<SiteTestimonial>(`/admin/testimonials/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/testimonials/${id}`),
  },

  reviews: {
    list: (params?: Record<string, unknown>) => api.get<unknown>('/admin/reviews', { params }),
    stats: () => api.get<unknown>('/admin/reviews/stats'),
    get: (id: string | number) => api.get<unknown>(`/admin/reviews/${id}`),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/reviews/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/reviews/${id}`),
    approve: (id: string | number) => api.post<unknown>(`/admin/reviews/${id}/approve`),
    reject: (id: string | number) => api.post<unknown>(`/admin/reviews/${id}/reject`),
    reply: (id: string | number, admin_reply: string) => api.post<unknown>(`/admin/reviews/${id}/reply`, { admin_reply }),
    feature: (id: string | number, is_featured: boolean) => api.post<unknown>(`/admin/reviews/${id}/feature`, { is_featured }),
    verify: (id: string | number, is_verified: boolean) => api.post<unknown>(`/admin/reviews/${id}/verify`, { is_verified }),
    export: (params?: Record<string, unknown>) => api.get<Blob>('/admin/reviews/export', { params, responseType: 'blob' }),
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
    sendTestEmail: (id: string | number, payload: { to: string }) =>
      api.post<null>(`/admin/integrations/${id}/test-email`, payload, { timeout: 60000 }),
  },

    licenses: {
    list: (params?: { search?: string; status?: string; product_id?: number }) =>
      api.get<unknown>('/admin/licenses', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/licenses/${id}`),
    create: (payload: { subscription_id: number; allowed_domains?: string[]; max_devices?: number }) =>
      api.post<unknown>('/admin/licenses', payload),
    update: (id: string | number, payload: { allowed_domains?: string[]; max_devices?: number; expires_at?: string }) =>
      api.put<unknown>(`/admin/licenses/${id}`, payload),
    suspend: (id: string | number) => api.post<null>(`/admin/licenses/${id}/suspend`),
    revoke: (id: string | number, reason?: string) =>
      api.post<null>(`/admin/licenses/${id}/revoke`, { reason }),
    activate: (id: string | number) => api.post<null>(`/admin/licenses/${id}/activate`),
    resetDomains: (id: string | number) => api.post<unknown>(`/admin/licenses/${id}/reset-domains`),
    forceLogout: (id: string | number) => api.post<unknown>(`/admin/licenses/${id}/force-logout`),
    regenerate: (id: string | number) => api.post<unknown>(`/admin/licenses/${id}/regenerate`),
    notifyReady: (id: string | number, payload?: { product_url?: string }) =>
      api.post<unknown>(`/admin/licenses/${id}/notify-ready`, payload ?? {}),
    activity: (id: string | number) => api.get<unknown>(`/admin/licenses/${id}/activity`),
    history: (id: string | number) => api.get<unknown>(`/admin/licenses/${id}/history`),
    installations: (id: string | number) => api.get<unknown>(`/admin/licenses/${id}/installations`),
    resetInstallations: (id: string | number) => api.post<unknown>(`/admin/licenses/${id}/installations/reset`),
    revokeInstallation: (id: string | number, installationId: string | number) =>
      api.post<unknown>(`/admin/licenses/${id}/installations/${installationId}/revoke`),
    delete: (id: string | number) => api.delete<null>(`/admin/licenses/${id}`),
  },

  productIntegrations: {
    list: (params?: { search?: string; status?: string }) =>
      api.get<unknown>('/admin/product-integrations', { params }),
    get: (id: string | number) => api.get<unknown>(`/admin/product-integrations/${id}`),
    create: (payload: { product_id: string | number; name?: string; slug?: string; version?: string; api_base_url?: string }) =>
      api.post<unknown>('/admin/product-integrations', payload),
    update: (id: string | number, payload: Record<string, unknown>) =>
      api.put<unknown>(`/admin/product-integrations/${id}`, payload),
    regenerateKeys: (id: string | number) => api.post<unknown>(`/admin/product-integrations/${id}/regenerate-keys`),
    guide: (id: string | number) => api.get<unknown>(`/admin/product-integrations/${id}/guide`),
    apiLogs: (params?: { search?: string; failed_only?: boolean }) =>
      api.get<unknown>('/admin/product-integrations/api-logs', { params }),
    domainResetRequests: (params?: { status?: string }) =>
      api.get<unknown>('/admin/product-integrations/domain-reset-requests', { params }),
    reviewDomainReset: (id: string | number, payload: { status: 'approved' | 'rejected' }) =>
      api.post<unknown>(`/admin/product-integrations/domain-reset-requests/${id}/review`, payload),
    delete: (id: string | number) => api.delete<null>(`/admin/product-integrations/${id}`),
  },

  chatbot: {
    dashboard: () => api.get<unknown>('/admin/chatbot/dashboard'),
    analytics: () => api.get<unknown>('/admin/chatbot/analytics'),
    settings: {
      get: () => api.get<unknown>('/admin/chatbot/settings'),
      update: (payload: unknown) => api.put<unknown>('/admin/chatbot/settings', payload),
    },
    faqs: {
      list: (params?: { language?: string; category?: string }) =>
        api.get<unknown[]>('/admin/chatbot/faqs', { params }),
      create: (payload: unknown) => api.post<unknown>('/admin/chatbot/faqs', payload),
      update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/chatbot/faqs/${id}`, payload),
      delete: (id: string | number) => api.delete<null>(`/admin/chatbot/faqs/${id}`),
    },
    categories: {
      list: () => api.get<unknown[]>('/admin/chatbot/categories'),
      create: (payload: unknown) => api.post<unknown>('/admin/chatbot/categories', payload),
      update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/chatbot/categories/${id}`, payload),
      delete: (id: string | number) => api.delete<null>(`/admin/chatbot/categories/${id}`),
    },
    leads: {
      list: (params?: { status?: string; page?: number }) =>
        api.get<unknown>('/admin/chatbot/leads', { params }),
      update: (id: string | number, payload: unknown) => api.put<unknown>(`/admin/chatbot/leads/${id}`, payload),
      delete: (id: string | number) => api.delete<null>(`/admin/chatbot/leads/${id}`),
    },
    conversations: {
      list: (params?: { session_id?: string; page?: number }) =>
        api.get<unknown>('/admin/chatbot/conversations', { params }),
    },
  },
}
