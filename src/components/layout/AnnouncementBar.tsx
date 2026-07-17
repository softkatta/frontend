import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { offerGradientToCss, parseOfferGradient } from '@/lib/offerGradients'
import type { SiteOffer } from '@/types/offers'

const ROTATE_MS = 7000

type AnnouncementBarProps = {
  offers: SiteOffer[]
}

/** Highlight coupon-like tokens in offer copy */
function formatOfferText(text: string) {
  const parts = text.split(/(\b[A-Z0-9]{4,}\b)/g)
  return parts.map((part, i) => {
    if (/^[A-Z0-9]{4,}$/.test(part)) {
      return (
        <span key={`${part}-${i}`} className="offer-strip__code">
          {part}
        </span>
      )
    }
    return part
  })
}

export function AnnouncementBar({ offers }: AnnouncementBarProps) {
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const active = offers.filter((o) => o.active !== false && o.text.trim())

  useEffect(() => {
    if (active.length <= 1) return

    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % active.length)
      setAnimKey((k) => k + 1)
    }, ROTATE_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active.length])

  useEffect(() => {
    if (current >= active.length) setCurrent(0)
  }, [active.length, current])

  if (active.length === 0) return null

  const offer = active[current % active.length]
  const colors = parseOfferGradient(offer.gradient)
  const gradient = offerGradientToCss(colors)

  return (
    <div
      className="offer-strip offer-strip--custom"
      role="region"
      aria-label="Current offers"
      style={{
        background: `linear-gradient(90deg, color-mix(in srgb, ${colors.from} 18%, transparent), color-mix(in srgb, ${colors.via} 14%, transparent), color-mix(in srgb, ${colors.to} 18%, transparent)), var(--offer-strip-base, rgba(8, 8, 20, 0.9))`,
      }}
    >
      <div className="offer-strip__line" style={{ background: gradient }} aria-hidden />
      <div
        className="offer-strip__mesh"
        style={{
          background: `radial-gradient(circle at 15% 50%, color-mix(in srgb, ${colors.from} 22%, transparent), transparent 45%), radial-gradient(circle at 85% 50%, color-mix(in srgb, ${colors.to} 22%, transparent), transparent 45%)`,
        }}
        aria-hidden
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="offer-strip__row">
          <div className="offer-strip__lead shrink-0">
            <span className="offer-strip__badge">
              <Sparkles className="h-3 w-3" aria-hidden />
              Offer
            </span>
          </div>

          <div className="offer-strip__body min-w-0 flex-1">
            <p key={animKey} className="offer-strip__text">
              {formatOfferText(offer.text.replace(/^[\s🎉]+/, ''))}
            </p>
          </div>

          <div className="offer-strip__actions shrink-0 flex items-center gap-2 sm:gap-3">
            {offer.cta_label && offer.cta_href && (
              <Link to={offer.cta_href} className="offer-strip__cta">
                <span className="hidden sm:inline">{offer.cta_label}</span>
                <span className="sm:hidden">View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {active.length > 1 && (
              <div className="hidden sm:flex items-center gap-1" aria-hidden>
                {active.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show offer ${i + 1}`}
                    onClick={() => {
                      setCurrent(i)
                      setAnimKey((k) => k + 1)
                    }}
                    className={cn(
                      'offer-strip__dot',
                      i === current % active.length && 'offer-strip__dot--active',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
