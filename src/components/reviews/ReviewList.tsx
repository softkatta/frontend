import type { PublicReview } from '@/types/reviews'
import { ReviewCard } from './ReviewCard'
import { Skeleton } from '@/components/ui/skeleton'

type ReviewListProps = {
  reviews: PublicReview[]
  loading?: boolean
  emptyMessage?: string
  onHelpful?: (uuid: string) => void
}

export function ReviewList({
  reviews,
  loading = false,
  emptyMessage = 'No reviews yet. Be the first to share your experience.',
  onHelpful,
}: ReviewListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-16 w-full max-w-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {reviews.map((review) => (
        <ReviewCard key={review.uuid} review={review} onHelpful={onHelpful} />
      ))}
    </div>
  )
}
