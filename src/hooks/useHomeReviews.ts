import { reviewsApi } from '@/services/api/modules/reviews.api'
import type { PublicReview, ReviewStats } from '@/types/reviews'

export type HomeReviewsBundle = {
  featured: PublicReview[]
  latest: PublicReview[]
  stats: ReviewStats | null
}

let homeReviewsCache: HomeReviewsBundle | null = null
let homeReviewsInflight: Promise<HomeReviewsBundle> | null = null

export function prefetchHomeReviews() {
  void fetchHomeReviews()
}

export async function fetchHomeReviews(force = false): Promise<HomeReviewsBundle> {
  if (force) {
    homeReviewsCache = null
  }
  if (!force && homeReviewsCache) return homeReviewsCache
  if (homeReviewsInflight) return homeReviewsInflight

  homeReviewsInflight = reviewsApi
    .home({ featured_limit: 8, latest_limit: 0 })
    .then((data) => {
      homeReviewsCache = {
        featured: data.featured ?? [],
        latest: data.latest ?? [],
        stats: data.stats ?? null,
      }
      return homeReviewsCache
    })
    .catch(() => {
      const empty: HomeReviewsBundle = { featured: [], latest: [], stats: null }
      return empty
    })
    .finally(() => {
      homeReviewsInflight = null
    })

  return homeReviewsInflight
}

export function clearHomeReviewsCache() {
  homeReviewsCache = null
  homeReviewsInflight = null
}
