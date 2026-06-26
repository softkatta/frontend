import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  badge?: string
}

export function PageHeader({ title, description, children, className, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8', className)}
    >
      <div className="min-w-0">
        {badge && <span className="section-badge mb-3">{badge}</span>}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="text-[var(--muted-foreground)] mt-1.5 text-sm leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {children && <div className="page-header-actions flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </motion.div>
  )
}
