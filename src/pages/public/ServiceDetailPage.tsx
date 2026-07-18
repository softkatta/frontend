import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart3, type LucideIcon } from 'lucide-react'
import { PageSection } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { RatingSummary } from '@/components/reviews/RatingSummary'
import { ReviewList } from '@/components/reviews/ReviewList'
import { StarRating } from '@/components/reviews/StarRating'
import { usePublicService } from '@/hooks/usePublicServices'
import { usePageSeo } from '@/hooks/usePageSeo'
import { serviceIconKey } from '@/lib/serviceIcons'
import { serviceImageSrc } from '@/lib/serviceImages'
import { reviewsApi } from '@/services/api/modules/reviews.api'
import type { PublicReview, ReviewStats } from '@/types/reviews'

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart: BarChart3,
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const { service, loading, notFound } = usePublicService(slug)
  const [serviceReviews, setServiceReviews] = useState<PublicReview[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  usePageSeo(service ? {
    title: service.meta_title || `${service.name} — Services | SoftKatta Solutions`,
    description: service.meta_description || service.description?.slice(0, 160) || `${service.name} by SoftKatta Solutions.`,
    path: `/services/${service.slug}`,
    image: serviceImageSrc(service.image),
    jsonLd: reviewStats && reviewStats.approved > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewStats.average_rating,
        reviewCount: reviewStats.approved,
        bestRating: 5,
        worstRating: 1,
      },
    } : undefined,
  } : null)

  useEffect(() => {
    if (!slug) return
    setReviewsLoading(true)
    void reviewsApi.serviceReviews(slug, { per_page: 12 })
      .then((res) => {
        setServiceReviews(res.reviews?.data ?? [])
        setReviewStats(res.stats)
      })
      .catch(() => {
        setServiceReviews([])
        setReviewStats(null)
      })
      .finally(() => setReviewsLoading(false))
  }, [slug])

  if (loading) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </PageSection>
    )
  }

  if (notFound || !service) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center">
        <div className="text-center w-full">
          <h1 className="font-display text-2xl font-bold mb-4">Service not found</h1>
          <Link to="/services" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> All Services
          </Link>
        </div>
      </PageSection>
    )
  }

  const Icon = iconMap[serviceIconKey(service.icon)] || Code
  const bodyParagraphs = service.body?.split(/\n\n+/).filter(Boolean) ?? []

  return (
    <div>
      <section className="hero-cyber pt-24 pb-14 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-50" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--brand-blue)] mb-6">
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end gap-8">
            <div className="flex-1">
              <span className="section-label mb-4">Professional Services</span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">{service.name}</h1>
              {reviewStats && reviewStats.approved > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <StarRating value={reviewStats.average_rating} readOnly size="sm" showValue />
                  <span className="text-sm text-muted-foreground">{reviewStats.approved} reviews</span>
                </div>
              )}
              {service.description && (
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{service.description}</p>
              )}
            </div>
            <div className="premium-card p-6 flex items-center gap-4 shrink-0">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Icon className="h-8 w-8 text-[var(--brand-blue)]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PageSection tone="default" className="!pt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {bodyParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-muted-foreground text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
            {service.bullets && service.bullets.length > 0 && (
              <div>
                {service.bullets_heading && (
                  <h2 className="font-display text-xl font-bold mb-4">{service.bullets_heading}</h2>
                )}
                <ul className="grid sm:grid-cols-2 gap-3">
                  {service.bullets.map((item) => (
                    <li key={item} className="premium-card px-4 py-3 rounded-xl text-sm font-medium">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-5 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Customer reviews</h2>
                <Link
                  to={`/reviews/write?type=service&slug=${service.slug}`}
                  className="hero-cta-primary inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  Write a review
                </Link>
              </div>
              {reviewStats && <RatingSummary stats={reviewStats} />}
              <ReviewList
                reviews={serviceReviews}
                loading={reviewsLoading}
                emptyMessage="No reviews for this service yet."
                onHelpful={(uuid) => {
                  void reviewsApi.markHelpful(uuid).then((res) => {
                    setServiceReviews((prev) =>
                      prev.map((r) => (r.uuid === uuid ? { ...r, helpful_count: res.helpful_count } : r)),
                    )
                  })
                }}
              />
            </div>
          </div>

          <div>
            <div className="premium-card p-6 sticky top-24 shadow-glow-md">
              <h3 className="font-display font-bold text-lg mb-2">Get a Quote</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Tell us about your project and we&apos;ll respond within 24 hours with a tailored proposal.
              </p>
              <Link to="/contact" className="glow-btn flex items-center justify-center w-full py-3 rounded-full text-sm font-semibold mb-3">
                Request Quote
              </Link>
              <Link
                to={`/reviews/write?type=service&slug=${service.slug}`}
                className="hero-cta-ghost flex items-center justify-center w-full py-3 rounded-full text-sm font-semibold mb-3"
              >
                Write a Review
              </Link>
              <Link to="/register" className="hero-cta-ghost flex items-center justify-center w-full py-3 rounded-full text-sm font-semibold">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
