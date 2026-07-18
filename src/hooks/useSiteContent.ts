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

export type SiteContentMode = 'hero' | 'below-fold' | 'faqs'

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

let cachedFaqs: HomeFaq[] | null = null
let faqsInflight: Promise<HomeFaq[]> | null = null
let cachedTestimonials: HomeTestimonial[] | null = null

async function fetchFaqs(): Promise<HomeFaq[]> {
  if (cachedFaqs) return cachedFaqs
  if (faqsInflight) return faqsInflight

  faqsInflight = siteContentApi
    .faqs()
    .then((raw) => {
      const list = unwrapList(raw).map((f) => ({
        id: String((f as { id: unknown }).id),
        question: String((f as { question: string }).question),
        answer: String((f as { answer: string }).answer),
      }))
      cachedFaqs = list
      return list
    })
    .finally(() => {
      faqsInflight = null
    })

  return faqsInflight
}

export async function fetchTestimonialsFallback(): Promise<HomeTestimonial[]> {
  if (cachedTestimonials) return cachedTestimonials
  try {
    const list = unwrapList(await siteContentApi.testimonials()).map((t) => mapTestimonial(t as SiteTestimonial))
    cachedTestimonials = list
    return list
  } catch {
    return []
  }
}

export function useSiteContent(mode: SiteContentMode = 'hero') {
  const [reloadToken, setReloadToken] = useState(contentReloadToken)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => cachedHeroSlides ?? [])
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>(() => cachedTestimonials ?? [])
  const [faqs, setFaqs] = useState<HomeFaq[]>(() => cachedFaqs ?? [])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'content')) {
        cachedHeroSlides = null
        cachedFaqs = null
        cachedTestimonials = null
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

    async function loadFaqsOnly() {
      try {
        const list = await fetchFaqs()
        if (!cancelled) setFaqs(list)
      } catch {
        if (!cancelled) setFaqs([])
      }
    }

    async function loadRest() {
      try {
        const [testimonialItems, faqItems] = await Promise.allSettled([
          siteContentApi.testimonials(),
          fetchFaqs(),
        ])
        if (cancelled) return

        if (testimonialItems.status === 'fulfilled') {
          const list = unwrapList(testimonialItems.value).map((t) => mapTestimonial(t as SiteTestimonial))
          cachedTestimonials = list
          setTestimonials(list)
        } else {
          setTestimonials([])
        }

        if (faqItems.status === 'fulfilled') {
          setFaqs(faqItems.value)
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

    if (mode === 'faqs') {
      void loadFaqsOnly()
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
