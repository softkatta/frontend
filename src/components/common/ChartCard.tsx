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
    <Card className={cn('admin-chart-card overflow-hidden', className)}>
      <CardHeader className="admin-chart-card__header flex flex-row items-center justify-between space-y-0 border-b border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--input)]/40 pb-4">
        <div>
          <CardTitle className="font-display text-base font-semibold">{title}</CardTitle>
          {description && <p className="text-sm text-[var(--muted-foreground)] mt-1 leading-relaxed">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
