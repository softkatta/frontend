import { ThumbsUp } from 'lucide-react'
import type { PublicReview } from '@/types/reviews'
import { StarRating } from './StarRating'
import { cn, formatTimeAgo } from '@/lib/utils'

type ReviewCardProps = {
  review: PublicReview
  className?: string
  onHelpful?: (uuid: string) => void
}

const AVATAR_TONES = [
  'bg-[#9aa0a6] text-white',
  'bg-[#7e57c2] text-white',
  'bg-[#5f6368] text-white',
  'bg-[#00897b] text-white',
  'bg-[#3949ab] text-white',
  'bg-[#c2185b] text-white',
  'bg-[#ef6c00] text-white',
  'bg-[#455a64] text-white',
] as const

function avatarTone(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[hash]
}

export function ReviewCard({ review, className, onHelpful }: ReviewCardProps) {
  const location = [review.city, review.country].filter(Boolean).join(', ')
  const meta = [review.company_name, location].filter(Boolean).join(' · ')
  const initial = review.full_name.trim().charAt(0).toUpperCase() || '?'
  const when = review.created_at ? formatTimeAgo(review.created_at) : null
  const repliedWhen = review.replied_at ? formatTimeAgo(review.replied_at) : null

  return (
    <article className={cn('py-5', className)}>
      <div className="flex items-start gap-3">
        {review.profile_image_url ? (
          <img
            src={review.profile_image_url}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              avatarTone(review.full_name),
            )}
            aria-hidden
          >
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
            {review.full_name}
          </h3>
          {meta ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">1 review</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRating value={review.rating} readOnly size="sm" className="gap-0.5" />
            {when && <span className="text-xs text-muted-foreground">{when}</span>}
          </div>

          {review.title && (
            <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {review.description}
          </p>

          {review.screenshot_url && (
            <img
              src={review.screenshot_url}
              alt=""
              loading="lazy"
              className="mt-3 max-h-48 max-w-full rounded-lg object-cover"
            />
          )}

          {review.admin_reply && (
            <div className="mt-4 border-l-2 border-[var(--border)] pl-3">
              <p className="text-xs font-semibold text-foreground">
                Response from SoftKatta
                {repliedWhen ? (
                  <span className="ml-2 font-normal text-muted-foreground">{repliedWhen}</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {review.admin_reply}
              </p>
            </div>
          )}

          {onHelpful && (
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onHelpful(review.uuid)}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful?
                {review.helpful_count > 0 ? (
                  <span className="tabular-nums">({review.helpful_count})</span>
                ) : null}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
