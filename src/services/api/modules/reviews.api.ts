import type {
  AdminReview,
  PublicReview,
  ReviewPaginator,
  ReviewStats,
  SubmitReviewPayload,
} from '@/types/reviews'
import { api } from '../wrapper'

function appendReviewForm(payload: SubmitReviewPayload): FormData {
  const formData = new FormData()
  formData.append('review_type', payload.review_type)
  if (payload.product_id) formData.append('product_id', String(payload.product_id))
  if (payload.service_id) formData.append('service_id', String(payload.service_id))
  formData.append('full_name', payload.full_name)
  if (payload.company_name) formData.append('company_name', payload.company_name)
  formData.append('email', payload.email)
  formData.append('mobile', payload.mobile)
  if (payload.city) formData.append('city', payload.city)
  if (payload.country) formData.append('country', payload.country)
  formData.append('rating', String(payload.rating))
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('would_recommend', payload.would_recommend ? '1' : '0')
  formData.append('consent', payload.consent ? '1' : '0')
  if (payload.recaptcha_token) formData.append('recaptcha_token', payload.recaptcha_token)
  if (payload.profile_image) formData.append('profile_image', payload.profile_image)
  if (payload.screenshot) formData.append('screenshot', payload.screenshot)
  return formData
}

export const reviewsApi = {
  captchaConfig: () =>
    api.get<{ enabled: boolean; site_key: string }>('/site/captcha', { skipAuth: true }),

  stats: (params?: { scope?: string; target_id?: number | string }) =>
    api.get<ReviewStats>('/reviews/stats', { params, skipAuth: true }),

  featured: (limit = 12) =>
    api.get<PublicReview[]>('/reviews/featured', { params: { limit }, skipAuth: true }),

  latest: (limit = 8) =>
    api.get<PublicReview[]>('/reviews/latest', { params: { limit }, skipAuth: true }),

  home: (params?: { featured_limit?: number; latest_limit?: number }) =>
    api.get<{
      featured: PublicReview[]
      latest: PublicReview[]
      stats: ReviewStats
    }>('/reviews/home', {
      params: {
        featured_limit: params?.featured_limit ?? 6,
        latest_limit: params?.latest_limit ?? 3,
      },
      skipAuth: true,
    }),

  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<ReviewPaginator>('/reviews', { params, skipAuth: true }),

  submit: (payload: SubmitReviewPayload) =>
    api.post<{ uuid: string; status: string; message: string }>('/reviews', appendReviewForm(payload), {
      skipAuth: true,
    }),

  productReviews: (slug: string, params?: { per_page?: number; rating?: number }) =>
    api.get<{
      product: { id: number; name: string; slug: string }
      stats: ReviewStats
      reviews: ReviewPaginator
    }>(`/products/${slug}/reviews`, { params, skipAuth: true }),

  serviceReviews: (slug: string, params?: { per_page?: number; rating?: number }) =>
    api.get<{
      service: { id: number; name: string; slug: string }
      stats: ReviewStats
      reviews: ReviewPaginator
    }>(`/services/${slug}/reviews`, { params, skipAuth: true }),

  markHelpful: (uuid: string) =>
    api.post<{ uuid: string; helpful_count: number }>(`/reviews/${uuid}/helpful`, {}, { skipAuth: true }),

  report: (uuid: string) =>
    api.post<{ uuid: string; report_count: number }>(`/reviews/${uuid}/report`, {}, { skipAuth: true }),
}

export type AdminReviewListParams = {
  status?: string
  rating?: string | number
  review_type?: string
  product_id?: string | number
  service_id?: string | number
  featured?: string | boolean
  date_from?: string
  date_to?: string
  search?: string
  per_page?: number
  page?: number
}

export const adminReviewsApi = {
  list: (params?: AdminReviewListParams) =>
    api.get<ReviewPaginator<AdminReview>>('/admin/reviews', { params }),
  stats: () => api.get<ReviewStats>('/admin/reviews/stats'),
  get: (id: string | number) => api.get<AdminReview>(`/admin/reviews/${id}`),
  update: (id: string | number, payload: unknown) =>
    api.put<AdminReview>(`/admin/reviews/${id}`, payload),
  delete: (id: string | number) => api.delete<null>(`/admin/reviews/${id}`),
  approve: (id: string | number) => api.post<AdminReview>(`/admin/reviews/${id}/approve`),
  reject: (id: string | number) => api.post<AdminReview>(`/admin/reviews/${id}/reject`),
  reply: (id: string | number, admin_reply: string) =>
    api.post<AdminReview>(`/admin/reviews/${id}/reply`, { admin_reply }),
  feature: (id: string | number, is_featured: boolean) =>
    api.post<AdminReview>(`/admin/reviews/${id}/feature`, { is_featured }),
  verify: (id: string | number, is_verified: boolean) =>
    api.post<AdminReview>(`/admin/reviews/${id}/verify`, { is_verified }),
  export: (params?: AdminReviewListParams) =>
    api.get<Blob>('/admin/reviews/export', { params, responseType: 'blob' }),
}
