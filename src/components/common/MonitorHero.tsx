import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { HERO_MONITOR_EXPORT_HEIGHT, HERO_MONITOR_EXPORT_WIDTH } from '@/lib/heroMonitor'
import { cn } from '@/lib/utils'
import type { HeroSlide } from '@/types/siteContent'

interface MonitorHeroProps {
  slides: HeroSlide[]
}

/** Kept for HomePage compatibility — boot sequence removed. */
export function hasHeroBootCompleted(): boolean {
  return true
}

export function MonitorHero({ slides }: MonitorHeroProps) {
  const [index, setIndex] = useState(0)
  const slideCount = slides.length

  useEffect(() => {
    const first = slides[0]
    const src = first ? resolveMediaUrl(first.image_url ?? first.image) : null
    if (!src) return

    // Preload LCP image for the browser (in addition to eager img)
    let link = document.querySelector<HTMLLinkElement>('link[data-hero-lcp]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.setAttribute('data-hero-lcp', '1')
      document.head.appendChild(link)
    }
    link.href = src

    const img = new Image()
    img.src = src
  }, [slides])

  useEffect(() => {
    if (slideCount <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slideCount), 4500)
    return () => window.clearInterval(id)
  }, [slideCount])

  const current = slides[index] ?? slides[0]
  const screenSrc = resolveMediaUrl(current?.image_url ?? current?.image)

  return (
    <div className="monitor-hero relative w-full max-w-3xl mx-auto lg:mx-0 lg:ml-auto">
      <div className="monitor-hero__glow absolute inset-0 rounded-3xl blur-3xl opacity-70" aria-hidden />

      <div className="monitor-hero__unit relative z-10">
        <div className="monitor-hero__bezel">
          <div className="monitor-hero__camera" aria-hidden />
          <div className="monitor-hero__screen">
            {slideCount > 0 && screenSrc && (
              <div key={current?.id ?? screenSrc} className="monitor-hero__slide-wrap">
                <img
                  src={screenSrc}
                  alt={current?.alt_text ?? current?.title ?? 'ERP Software Dashboard — SoftKatta Solutions'}
                  className="monitor-hero__slide monitor-hero__slide--live"
                  width={HERO_MONITOR_EXPORT_WIDTH}
                  height={HERO_MONITOR_EXPORT_HEIGHT}
                  sizes="(max-width: 1024px) 92vw, 560px"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </div>
            )}
          </div>
          <p className="monitor-hero__label">
            Soft<span>Katta</span>
          </p>
        </div>

        <div className="monitor-hero__neck" aria-hidden />
        <div className="monitor-hero__base" aria-hidden />
      </div>

      {slideCount > 1 && (
        <div className="monitor-hero__dots flex justify-center gap-2 mt-6">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn('monitor-hero__dot', i === index && 'monitor-hero__dot--active')}
              aria-label={`Show slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
