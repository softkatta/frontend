import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  readOnly?: boolean
  showValue?: boolean
}

const sizeClass = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
  readOnly = false,
  showValue = false,
}: StarRatingProps) {
  const interactive = Boolean(onChange) && !readOnly

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= Math.round(value)
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className={cn(
              'rounded-sm transition-transform',
              interactive && 'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]',
              !interactive && 'cursor-default',
            )}
            onClick={() => onChange?.(star)}
          >
            <Star
              className={cn(
                sizeClass[size],
                active ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold tabular-nums text-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
