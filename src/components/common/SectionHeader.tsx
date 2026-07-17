import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  badge?: string
  title: string
  highlight?: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({ badge, title, highlight, description, centered = true, className }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={cn(centered && 'text-center', 'mb-9 sm:mb-14', className)}
    >
      {badge && <span className="section-badge mb-4">{badge}</span>}
      <h2 className="mb-4 break-words text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
        {title}{' '}
        {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>
      {description && (
        <p className={cn('max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg', centered && 'mx-auto')}>
          {description}
        </p>
      )}
    </motion.div>
  )
}
