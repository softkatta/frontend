export type ReviewType = 'product' | 'service'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type PublicReview = {
  uuid: string
  review_type: ReviewType
  product_id?: number | null
  service_id?: number | null
  target_name?: string | null
  product?: { id: number; name: string; slug: string } | null
  service?: { id: number; name: string; slug: string } | null
  full_name: string
  company_name?: string | null
  city?: string | null
  country?: string | null
  rating: number
  title: string
  description: string
  profile_image_url?: string | null
  screenshot_url?: string | null
  would_recommend: boolean
  is_featured: boolean
  is_verified: boolean
  admin_reply?: string | null
  replied_at?: string | null
  helpful_count: number
  created_at?: string
}

export type AdminReview = PublicReview & {
  id: number
  email: string
  mobile: string
  status: ReviewStatus
  profile_image?: string | null
  screenshot?: string | null
  consent_at?: string | null
  report_count?: number
  ip_address?: string | null
  approved_at?: string | null
  approved_by?: number | null
  approver?: { id: number; name: string } | null
  updated_at?: string
}

export type ReviewStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  featured: number
  average_rating: number
  product_reviews: number
  service_reviews: number
  rating_distribution: Record<string, number>
  recommend_percent: number
}

export type ReviewPaginator<T = PublicReview> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type SubmitReviewPayload = {
  review_type: ReviewType
  product_id?: number | string
  service_id?: number | string
  full_name: string
  company_name?: string
  email: string
  mobile: string
  city?: string
  country?: string
  rating: number
  title: string
  description: string
  would_recommend: boolean
  consent: boolean
  profile_image?: File | null
  screenshot?: File | null
  recaptcha_token?: string
}
