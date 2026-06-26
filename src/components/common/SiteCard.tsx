import { Link } from 'react-router-dom'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCENTS = ['violet', 'cyan', 'emerald', 'purple'] as const

interface SiteCardProps {
  title: string
  description: string
  category?: string
  icon: LucideIcon
  href?: string
  ctaLabel?: string
  index?: number
  accent?: (typeof ACCENTS)[number]
  className?: string
  children?: React.ReactNode
}

export function SiteCard({
  title,
  description,
  category,
  icon: Icon,
  href,
  ctaLabel = 'Learn more',
  index = 0,
  accent,
  className,
  children,
}: SiteCardProps) {
  const accentKey = accent ?? ACCENTS[index % ACCENTS.length]

  return (
    <article
      className={cn('site-card-premium', className)}
      style={{ '--card-i': index } as React.CSSProperties}
      data-accent={accentKey}
    >
      <div className="site-card-premium__beam" aria-hidden />
      <div className="site-card-premium__mesh" aria-hidden />
      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="site-card-premium__icon-wrap mb-4">
          <Icon className="site-card-premium__icon w-5 h-5" style={{ color: 'var(--pc-accent)' }} />
        </div>
        {category && (
          <span
            className="inline-flex w-fit mb-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: 'var(--pc-accent)',
              background: 'var(--pc-accent-soft)',
              border: '1px solid color-mix(in srgb, var(--pc-accent) 20%, transparent)',
            }}
          >
            {category}
          </span>
        )}
        <h3 className="font-display font-bold text-lg mb-2 text-[var(--text-hero,var(--foreground))]">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{description}</p>
        {children}
        {href && (
          <div className="pt-4 border-t border-[var(--border)]">
            <Link
              to={href}
              className="site-card-premium__cta site-card-premium__cta--primary inline-flex items-center justify-center gap-1.5 w-full rounded-full py-2.5 text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, var(--pc-accent), color-mix(in srgb, var(--pc-accent) 70%, #2563eb))`,
                boxShadow: '0 6px 18px var(--pc-accent-glow)',
              }}
            >
              {ctaLabel} →
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
