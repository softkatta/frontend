import type { HeroSlide, SiteFaq, SiteTestimonial } from '@/types/siteContent'
import { api } from '../wrapper'

export const siteContentApi = {
  heroSlides: () => api.get<HeroSlide[]>('/hero-slides', { skipAuth: true }),
  testimonials: () => api.get<SiteTestimonial[]>('/testimonials', { skipAuth: true }),
  faqs: () => api.get<SiteFaq[]>('/faqs', { skipAuth: true }),
  offers: () => api.get<import('@/types/offers').SiteOffer[]>('/site/offers', { skipAuth: true }),
  branding: () =>
    api.get<{
      company_name: string
      company_tagline: string
      company_address: string
      company_phone: string
      company_website: string
      company_description?: string
      brand_short_name?: string
      company_logo: string | null
      company_logo_url: string | null
      favicon: string | null
      favicon_url: string | null
      support_email: string
      gst_number?: string
      gst_enabled?: boolean
      gst_rate?: number
      default_currency?: string
    }>('/site/branding', { skipAuth: true }),
  maintenance: () =>
    api.get<{
      enabled: boolean
      page_type: string
      badge: string
      message: string
      image_url?: string | null
      logo_url?: string | null
      company_name: string
      company_tagline: string
    }>('/site/maintenance', { skipAuth: true }),
  about: () =>
    api.get<{
      highlight_title: string
      highlight_text: string
      hero_label: string
      hero_title: string
      hero_highlight: string
      hero_description: string
      story_text: string
      mission_text?: string
      vision_text?: string
      values: Array<{ title: string; description: string }>
      milestones: Array<{ year: string; title: string; description: string }>
    }>('/site/about', { skipAuth: true }),
  pages: () => api.get<import('@/types/pageContent').PublicPagesPayload>('/site/pages', { skipAuth: true }),
  homeSections: () =>
    api.get<import('@/types/homeSections').HomeSections>('/site/home-sections', { skipAuth: true }),
}
