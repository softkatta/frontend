import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { testimonialAvatar } from '@/lib/mediaUrl'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar?: string | null
}

interface TestimonialCarouselProps {
  items: Testimonial[]
  className?: string
}

function getVisibleCount(width: number) {
  if (width >= 1024) return 2
  return 1
}

export function TestimonialCarousel({ items, className }: TestimonialCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [visibleCount, setVisibleCount] = useState(2)
  const [paused, setPaused] = useState(false)

  const pageCount = Math.max(1, Math.ceil(items.length / visibleCount))

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const scrollToPage = useCallback((nextPage: number) => {
    const track = trackRef.current
    if (!track) return
    const normalized = ((nextPage % pageCount) + pageCount) % pageCount
    const card = track.children[normalized * visibleCount] as HTMLElement | undefined
    if (card) {
      track.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' })
    }
    setPage(normalized)
  }, [pageCount, visibleCount])

  const next = useCallback(() => scrollToPage(page + 1), [page, scrollToPage])
  const prev = useCallback(() => scrollToPage(page - 1), [page, scrollToPage])

  useEffect(() => {
    if (paused || pageCount <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, pageCount])

  useEffect(() => {
    if (page >= pageCount) setPage(0)
  }, [page, pageCount])

  return (
    <div
      className={cn('testimonial-carousel relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="testimonial-carousel__track flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((t) => (
          <article
            key={t.id}
            className="testimonial-glass-card snap-start shrink-0 w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(50%-0.625rem)]"
          >
            <div className="testimonial-glass-card__panel p-6 h-full flex flex-col min-h-[240px]">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={testimonialAvatar(t.name, t.avatar)}
                  alt={t.name}
                  className="testimonial-glass-card__avatar h-12 w-12 rounded-full object-cover border-2 border-[var(--brand-blue)]/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="testimonial-glass-card__name font-display font-semibold text-sm">{t.name}</p>
                  <p className="testimonial-glass-card__role text-xs text-muted-foreground truncate">
                    {t.role}{t.company ? `, ${t.company}` : ''}
                  </p>
                  <div className="flex gap-0.5 mt-2">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-[var(--brand-teal)] text-[var(--brand-teal)]" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-glass-card__quote text-sm leading-relaxed flex-1">
                &ldquo;{t.content}&rdquo;
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <button type="button" onClick={prev} className="testimonial-glass-nav" aria-label="Previous">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToPage(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === page ? 'w-6 bg-[var(--brand-blue)]' : 'w-2 bg-[var(--border)]',
              )}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
        <button type="button" onClick={next} className="testimonial-glass-nav" aria-label="Next">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
