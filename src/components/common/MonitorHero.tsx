import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { BRAND_LOGO_SRC } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { HeroSlide } from '@/types/siteContent'

interface MonitorHeroProps {
  slides: HeroSlide[]
}

type BootPhase = 'powering' | 'booting' | 'ready'

/** In-memory only — resets on hard refresh, persists during SPA navigation */
let heroBootCompleted = false

const BOOT_PROGRESS_MS = 900

const BOOT_TIMINGS = {
  booting: 280,
  ready: 280 + BOOT_PROGRESS_MS + 180,
} as const

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function hasHeroBootCompleted(): boolean {
  return heroBootCompleted
}

function markHeroBootCompleted(): void {
  heroBootCompleted = true
}

export function MonitorHero({ slides }: MonitorHeroProps) {
  const skipBoot = hasHeroBootCompleted()
  const [bootPhase, setBootPhase] = useState<BootPhase>(() => (skipBoot ? 'ready' : 'powering'))
  const [reducedMotion] = useState(prefersReducedMotion)
  const [index, setIndex] = useState(0)
  const slideCount = slides.length

  useEffect(() => {
    if (skipBoot) return

    const finishBoot = () => {
      setBootPhase('ready')
      markHeroBootCompleted()
    }

    if (reducedMotion) {
      const t = window.setTimeout(finishBoot, 400)
      return () => window.clearTimeout(t)
    }

    const t1 = window.setTimeout(() => setBootPhase('booting'), BOOT_TIMINGS.booting)
    const t2 = window.setTimeout(finishBoot, BOOT_TIMINGS.ready)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [skipBoot, reducedMotion])

  useEffect(() => {
    const first = slides[0]
    const src = first ? resolveMediaUrl(first.image_url ?? first.image) : null
    if (!src) return
    const img = new Image()
    img.src = src
  }, [slides])

  useEffect(() => {
    if (bootPhase !== 'ready' || slideCount <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slideCount), 4500)
    return () => window.clearInterval(id)
  }, [bootPhase, slideCount])

  const current = slides[index] ?? slides[0]
  const screenSrc = resolveMediaUrl(current?.image_url ?? current?.image)
  const isReady = bootPhase === 'ready'
  const showBootBar = bootPhase === 'booting' || reducedMotion
  const animateEnter = !skipBoot

  return (
    <div className="monitor-hero relative w-full max-w-3xl mx-auto lg:mx-0 lg:ml-auto">
      <div
        className={cn(
          'monitor-hero__glow absolute inset-0 rounded-3xl blur-3xl opacity-70 transition-opacity duration-700',
          !isReady ? 'opacity-50' : 'opacity-70',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'monitor-hero__unit relative z-10',
          animateEnter && 'monitor-hero__unit--enter',
        )}
      >
        <div className={cn('monitor-hero__bezel', !isReady && 'monitor-hero__bezel--on')}>
          <div
            className={cn('monitor-hero__camera', !isReady && 'monitor-hero__camera--on')}
            aria-hidden
          />
          <div
            className={cn(
              'monitor-hero__screen',
              !isReady && 'monitor-hero__screen--boot',
              bootPhase === 'powering' && 'monitor-hero__screen--powering',
            )}
          >
            {!isReady && (
              <div className="monitor-hero__boot" aria-hidden>
                <div className="monitor-hero__boot-backlight monitor-hero__boot-backlight--on" />
                {bootPhase === 'powering' && (
                  <>
                    <div className="monitor-hero__boot-flicker" />
                    <div className="monitor-hero__boot-powerline" />
                  </>
                )}
                <div className="monitor-hero__boot-splash">
                  <img
                    src={BRAND_LOGO_SRC}
                    alt=""
                    className="monitor-hero__boot-logo"
                    decoding="async"
                    fetchPriority="high"
                  />
                  <p className="monitor-hero__boot-title">
                    Soft<span>Katta</span>
                  </p>
                  <div className="monitor-hero__boot-bar">
                    <span
                      className={cn(
                        'monitor-hero__boot-bar-fill',
                        showBootBar && 'monitor-hero__boot-bar-fill--active',
                      )}
                      style={showBootBar ? { animationDuration: `${BOOT_PROGRESS_MS}ms` } : undefined}
                    />
                  </div>
                  <p className="monitor-hero__boot-status">Starting workspace…</p>
                </div>
              </div>
            )}

            {isReady && slideCount > 0 && screenSrc && (
              <div
                key={skipBoot ? 'hero-ready' : (current?.id ?? screenSrc)}
                className={cn(
                  'monitor-hero__slide-wrap',
                  animateEnter && 'monitor-hero__slide-wrap--enter',
                )}
              >
                <img
                  src={screenSrc}
                  alt={current?.alt_text ?? current?.title ?? 'ERP Software Dashboard — SoftKatta Solutions'}
                  className="monitor-hero__slide monitor-hero__slide--live"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </div>
            )}
          </div>
          {isReady && (
            <p className="monitor-hero__label">
              Soft<span>Katta</span>
            </p>
          )}
        </div>

        <div className="monitor-hero__neck" aria-hidden />
        <div className="monitor-hero__base" aria-hidden />
      </div>

      {isReady && slideCount > 1 && (
        <div className="monitor-hero__dots flex justify-center gap-2 mt-6">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`monitor-hero__dot ${i === index ? 'monitor-hero__dot--active' : ''}`}
              aria-label={`Show slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
