import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function ChartCard({ title, description, children, className, action }: ChartCardProps) {
  return (
    <Card className={cn('admin-chart-card min-w-0 overflow-hidden', className)}>
      <CardHeader className="admin-chart-card__header flex flex-col items-start justify-between gap-3 space-y-0 border-b border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--input)]/40 pb-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <CardTitle className="font-display text-base font-semibold">{title}</CardTitle>
          {description && <p className="text-sm text-[var(--muted-foreground)] mt-1 leading-relaxed">{description}</p>}
        </div>
        {action ? <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden px-2 sm:px-6">{children}</CardContent>
    </Card>
  )
}
