import { useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'
import type { HeroSlide, SiteTestimonial } from '@/types/siteContent'

let cachedHeroSlides: HeroSlide[] | null = null
let contentReloadToken = 0

export function clearHeroSlidesCache() {
  cachedHeroSlides = null
  contentReloadToken += 1
}

export function clearSiteContentCache() {
  clearHeroSlidesCache()
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

type IdleHandle = ReturnType<typeof setTimeout>

function scheduleIdle(fn: () => void, timeoutMs = 1200): IdleHandle {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout: timeoutMs }) as unknown as IdleHandle
  }
  return setTimeout(fn, 80)
}

function cancelIdle(id: IdleHandle) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id as unknown as number)
    return
  }
  clearTimeout(id)
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
    let restTimer: ReturnType<typeof setTimeout> | undefined

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

    const run = () => {
      if (cancelled) return
      if (mode === 'hero') {
        void loadHero()
        return
      }
      restTimer = setTimeout(() => {
        if (!cancelled) void loadRest()
      }, 400)
    }

    if (mode === 'hero') {
      void loadHero()
    } else {
      const idleId = scheduleIdle(run)
      return () => {
        cancelled = true
        cancelIdle(idleId)
        if (restTimer) clearTimeout(restTimer)
      }
    }

    return () => {
      cancelled = true
      if (restTimer) clearTimeout(restTimer)
    }
  }, [mode, reloadToken])

  return { heroSlides, testimonials, faqs }
}
