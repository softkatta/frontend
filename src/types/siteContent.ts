export interface HeroSlide {
  id: number | string
  title?: string | null
  image: string
  image_url?: string
  alt_text?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface SiteTestimonial {
  id: number | string
  name: string
  company?: string | null
  designation?: string | null
  role?: string
  content: string
  avatar?: string | null
  avatar_url?: string | null
  rating: number
  is_active?: boolean
  sort_order?: number
}

export interface SiteFaq {
  id: number | string
  question: string
  answer: string
  category?: string | null
  is_active?: boolean
  sort_order?: number
}
