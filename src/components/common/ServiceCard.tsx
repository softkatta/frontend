import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Code, Cloud, Lightbulb, Rocket, Shield, Palette, Phone, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, typeof Code> = {
  Code,
  Cloud,
  Lightbulb,
  Rocket,
  Shield,
  Palette,
  BarChart: BarChart3,
}

const ACCENTS = ['#2563eb', '#0891b2', '#6366f1', '#059669', '#1e40af', '#14b8a6']

interface ServiceCardProps {
  slug: string
  title: string
  description: string
  icon: string
  image?: string
  duration?: string
  freeConsultation?: boolean
  index?: number
}

export function ServiceCard({
  slug,
  title,
  description,
  icon,
  image,
  duration,
  freeConsultation = true,
  index = 0,
}: ServiceCardProps) {
  const Icon = ICONS[icon] ?? Code
  const accent = ACCENTS[index % ACCENTS.length]

  return (
    <Link
      to={`/services/${slug}`}
      className="service-card-premium group block"
      style={{ '--svc-accent': accent, '--card-i': index } as React.CSSProperties}
      data-accent={accent}
    >
      <div className="service-card-premium__beam" aria-hidden />
      <div className="service-card-premium__mesh" aria-hidden />
      {image ? (
        <div className="service-card-premium__image-wrap">
          <img src={image} alt={title} className="service-card-premium__image" loading="lazy" />
        </div>
      ) : null}
      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="service-card-premium__icon">
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {freeConsultation && (
            <span className="service-card-premium__badge">
              <Phone className="h-3 w-3" /> Free Consult
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-base mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">{description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          {duration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {duration}
            </span>
          )}
          <span className={cn('text-xs font-semibold text-[var(--brand-blue)] flex items-center gap-1', !duration && 'ml-auto')}>
            Learn more <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}
