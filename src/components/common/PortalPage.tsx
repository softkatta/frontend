import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PortalPageProps {
  children: ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'wide'
}

const widths = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-[90rem]',
}

export function PortalPage({ children, className, size = 'default' }: PortalPageProps) {
  return <div className={cn('mx-auto space-y-6 pt-1 sm:pt-2', widths[size], className)}>{children}</div>
}

export function PortalPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('admin-portal-panel overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm', className)}>
      {children}
    </div>
  )
}

interface PortalWelcomeProps {
  eyebrow: string
  title: string
  description?: string
  aside?: ReactNode
}

export function PortalWelcome({ eyebrow, title, description, aside }: PortalWelcomeProps) {
  return (
    <div className="dashboard-welcome rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
          )}
        </div>
        {aside}
      </div>
    </div>
  )
}

export const portalNotificationTone = {
  success: 'border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/8',
  warning: 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/8',
  info: 'border-[var(--border)] bg-[var(--input)]',
  error: 'border-[var(--destructive)]/25 bg-[var(--destructive)]/8',
} as const

export const chartTooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--card-foreground)',
} as const
