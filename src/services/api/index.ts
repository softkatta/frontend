export { api, ApiError } from './wrapper'
export { apiClient, registerAuthLogoutHandler } from './client'
export type { ApiRequestConfig, ApiSuccessResponse, PaginatedResponse } from './types'

export { authApi, isTwoFactorChallenge } from './modules/auth.api'
export type { AuthSession, ChangePasswordPayload, ProfileUpdatePayload } from './modules/auth.api'
export { productsApi } from './modules/products.api'
export { servicesApi } from './modules/services.api'
export { blogsApi } from './modules/blogs.api'
export { contactApi } from './modules/contact.api'
export { pricingApi } from './modules/pricing.api'
export { siteContentApi } from './modules/siteContent.api'
export { clientApi } from './modules/client.api'
export { adminApi } from './modules/admin.api'
export { inboxApi } from './modules/inbox.api'

import { adminApi } from './modules/admin.api'
import { authApi } from './modules/auth.api'
import { blogsApi } from './modules/blogs.api'
import { clientApi } from './modules/client.api'
import { contactApi } from './modules/contact.api'
import { pricingApi } from './modules/pricing.api'
import { productsApi } from './modules/products.api'
import { servicesApi } from './modules/services.api'
import { siteContentApi } from './modules/siteContent.api'

/** Unified API surface for the application */
export const ApiService = {
  auth: authApi,
  products: productsApi,
  services: servicesApi,
  blogs: blogsApi,
  contact: contactApi,
  pricing: pricingApi,
  siteContent: siteContentApi,
  client: clientApi,
  admin: adminApi,
}

export default ApiService
