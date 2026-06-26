import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  gradient?: 'blue' | 'green' | 'purple' | 'teal'
}

const GRADIENTS = {
  blue: 'from-blue-500/20 to-blue-600/5',
  green: 'from-emerald-500/20 to-emerald-600/5',
  purple: 'from-violet-500/20 to-violet-600/5',
  teal: 'from-teal-500/20 to-teal-600/5',
}

const ICON_COLORS = {
  blue: 'text-secondary',
  green: 'text-accent',
  purple: 'text-violet-500',
  teal: 'text-[var(--brand-teal)]',
}

export function StatCard({ title, value, description, icon: Icon, trend, className, gradient = 'blue' }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden hover:!translate-y-0 group', className)}>
      <CardContent className="p-0">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', GRADIENTS[gradient])} />
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{title}</p>
              <p className="text-3xl font-extrabold tracking-tight">{value}</p>
              {description && <p className="text-xs text-[var(--muted-foreground)]">{description}</p>}
              {trend && (
                <p className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-accent' : 'text-[var(--destructive)]')}>
                  {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                </p>
              )}
            </div>
            <div className={cn('icon-box h-12 w-12 group-hover:scale-110 transition-transform duration-300')}>
              <Icon className={cn('h-5 w-5', ICON_COLORS[gradient])} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
