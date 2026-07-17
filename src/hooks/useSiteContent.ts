import { useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'
import { clearPublicPageContentCache } from '@/hooks/usePublicPageContent'
import type { HeroSlide, SiteTestimonial } from '@/types/siteContent'

let cachedHeroSlides: HeroSlide[] | null = null
let contentReloadToken = 0

export function clearHeroSlidesCache() {
  cachedHeroSlides = null
  contentReloadToken += 1
}

export function clearSiteContentCache() {
  clearHeroSlidesCache()
  clearPublicPageContentCache()
}

export type HomeTestimonial = {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar?: string | null
}

export type HomeFaq = {
  id: string
  question: string
  answer: string
}

export type SiteContentMode = 'hero' | 'below-fold'

function mapTestimonial(t: SiteTestimonial): HomeTestimonial {
  return {
    id: String(t.id),
    name: t.name,
    role: t.designation ?? t.role ?? '',
    company: t.company ?? '',
    content: t.content,
    rating: t.rating,
    avatar: t.avatar_url ?? t.avatar ?? null,
  }
}

export function useSiteContent(mode: SiteContentMode = 'hero') {
  const [reloadToken, setReloadToken] = useState(contentReloadToken)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => cachedHeroSlides ?? [])
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([])
  const [faqs, setFaqs] = useState<HomeFaq[]>([])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'content')) {
        cachedHeroSlides = null
        contentReloadToken += 1
        setReloadToken(contentReloadToken)
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadHero() {
      if (cachedHeroSlides) {
        setHeroSlides(cachedHeroSlides)
        return
      }
      try {
        const list = unwrapList(await siteContentApi.heroSlides())
        if (!cancelled && list.length > 0) {
          cachedHeroSlides = list as HeroSlide[]
          setHeroSlides(cachedHeroSlides)
        } else if (!cancelled) {
          setHeroSlides([])
        }
      } catch {
        if (!cancelled) setHeroSlides([])
      }
    }

    async function loadRest() {
      try {
        const [testimonialItems, faqItems] = await Promise.allSettled([
          siteContentApi.testimonials(),
          siteContentApi.faqs(),
        ])
        if (cancelled) return

        if (testimonialItems.status === 'fulfilled') {
          const list = unwrapList(testimonialItems.value)
          setTestimonials(list.map((t) => mapTestimonial(t as SiteTestimonial)))
        } else {
          setTestimonials([])
        }

        if (faqItems.status === 'fulfilled') {
          const list = unwrapList(faqItems.value)
          setFaqs(list.map((f) => ({
            id: String((f as { id: unknown }).id),
            question: String((f as { question: string }).question),
            answer: String((f as { answer: string }).answer),
          })))
        } else {
          setFaqs([])
        }
      } catch {
        if (!cancelled) {
          setTestimonials([])
          setFaqs([])
        }
      }
    }

    if (mode === 'hero') {
      void loadHero()
      return () => {
        cancelled = true
      }
    }

    void loadRest()
    return () => {
      cancelled = true
    }
  }, [mode, reloadToken])

  return { heroSlides, testimonials, faqs }
}
