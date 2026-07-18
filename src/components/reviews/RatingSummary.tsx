import type { ReviewStats } from '@/types/reviews'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

type RatingSummaryProps = {
  stats: ReviewStats
  className?: string
  compact?: boolean
}

export function RatingSummary({ stats, className, compact = false }: RatingSummaryProps) {
  const total = stats.approved || 0

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8', className)}>
      <div className="text-center sm:text-left">
        <p className="font-display text-4xl font-bold tabular-nums text-foreground">
          {stats.average_rating.toFixed(1)}
        </p>
        <StarRating value={stats.average_rating} readOnly size="md" className="mt-1 justify-center sm:justify-start" />
        <p className="mt-1 text-xs text-muted-foreground">
          {total} review{total === 1 ? '' : 's'}
          {stats.recommend_percent > 0 ? ` · ${stats.recommend_percent}% recommend` : ''}
        </p>
      </div>

      {!compact && (
        <div className="min-w-0 flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.rating_distribution?.[String(star)] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 tabular-nums text-muted-foreground">{star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
