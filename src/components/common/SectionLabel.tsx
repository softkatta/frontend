import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return <span className={cn('section-label', className)}>{children}</span>
}

interface PageSectionProps {
  tone?: 'default' | 'muted' | 'card' | 'radial'
  className?: string
  children: React.ReactNode
  id?: string
}

export function PageSection({ tone = 'default', className, children, id }: PageSectionProps) {
  return (
    <section id={id} data-section-tone={tone} className={cn('relative py-20 sm:py-24 overflow-hidden', className)}>
      <div className="section-content container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

interface SectionHeaderBlockProps {
  label: string
  title: string
  highlight?: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeaderBlock({
  label,
  title,
  highlight,
  description,
  centered = true,
  className,
}: SectionHeaderBlockProps) {
  return (
    <div className={cn(centered && 'text-center', 'mb-12 sm:mb-14', className)} data-section-header>
      <SectionLabel>{label}</SectionLabel>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-hero,var(--foreground))] mb-4">
        {title}{' '}
        {highlight && <span className="text-brand-gradient">{highlight}</span>}
      </h2>
      {description && (
        <p className={cn('text-muted-foreground text-lg max-w-2xl leading-relaxed', centered && 'mx-auto')}>
          {description}
        </p>
      )}
    </div>
  )
}
