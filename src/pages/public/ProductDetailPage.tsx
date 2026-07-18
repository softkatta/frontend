import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Zap,
} from 'lucide-react'
import { PageSection } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn, formatCurrency } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { usePublicProduct } from '@/hooks/usePublicProducts'
import { getProductScreenshot } from '@/lib/productAssets'
import { mediaSrc } from '@/lib/mediaUrl'
import { isEmbeddableVideo, resolveDemoVideoUrl } from '@/lib/videoUrl'
import { productHasFreeTrial, productTrialRegisterUrl } from '@/lib/productTrial'
import { SimpleBillingToggle } from '@/components/common/SimpleBillingToggle'
import { getDefaultPlan, getProductPlanSummary, planForBilling, yearlySavingsPercent } from '@/lib/purchasePlan'
import { useSiteContent } from '@/hooks/useSiteContent'
import { usePageSeo } from '@/hooks/usePageSeo'
import { RatingSummary } from '@/components/reviews/RatingSummary'
import { ReviewList } from '@/components/reviews/ReviewList'
import { StarRating } from '@/components/reviews/StarRating'
import { reviewsApi } from '@/services/api/modules/reviews.api'
import type { PublicReview, ReviewStats } from '@/types/reviews'

type ShopBilling = 'monthly' | 'yearly'
type DetailTab = 'features' | 'faq' | 'reviews'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function PurchasePanel({
  product,
  raw,
  billing,
  onBillingChange,
  onBuy,
  onAddToCart,
}: {
  product: NonNullable<ReturnType<typeof usePublicProduct>['product']>
  raw: unknown
  billing: ShopBilling
  onBillingChange: (b: ShopBilling) => void
  onBuy: () => void
  onAddToCart: () => void
}) {
  const showTrial = productHasFreeTrial(product)
  const summary = getProductPlanSummary(raw)
  const plan = planForBilling(summary, billing)
  const savings = yearlySavingsPercent(summary.monthly?.price ?? 0, summary.yearly?.price ?? 0)
  const price = plan?.price ?? 0

  return (
    <div className="product-buy-panel">
      <div className="product-buy-panel__glow" aria-hidden />
      <div className="product-buy-panel__header">
        <p className="product-buy-panel__label">Subscribe to {product.name}</p>
        {price > 0 ? (
          <div className="product-buy-panel__price">
            <span className="product-buy-panel__amount">{formatCurrency(price)}</span>
            <span className="product-buy-panel__cycle">/{billing === 'yearly' ? 'year' : 'mo'}</span>
          </div>
        ) : (
          <p className="font-display text-2xl font-bold">Contact for pricing</p>
        )}
      </div>

      <SimpleBillingToggle
        raw={raw}
        billing={billing}
        onBillingChange={(cycle) => {
          if (cycle === 'monthly' || cycle === 'yearly') onBillingChange(cycle)
        }}
      />

      {billing === 'yearly' && savings > 0 && (
        <div className="product-buy-panel__savings">
          <Zap className="h-4 w-4 shrink-0" />
          Save {savings}% with yearly billing
        </div>
      )}

      <div className="space-y-2.5">
        <button type="button" onClick={onBuy} className="glow-btn flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold">
          <ShoppingBag className="h-4 w-4" /> Buy now
        </button>
        <button type="button" onClick={onAddToCart} className="hero-cta-ghost flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </button>
      </div>

      {showTrial && (
        <Link to={productTrialRegisterUrl(product.slug)} className="product-buy-panel__trial">
          <Sparkles className="h-4 w-4" />
          Try free for {product.trial_days || 14} days
        </Link>
      )}

      <ul className="product-buy-panel__trust">
        {[
          { icon: FileCheck, text: 'GST invoice' },
          { icon: ShieldCheck, text: 'Secure checkout' },
          ...(showTrial ? [{ icon: Sparkles, text: 'Free trial' }] : []),
        ].map(({ icon: Icon, text }) => (
          <li key={text}><Icon className="h-3.5 w-3.5" />{text}</li>
        ))}
      </ul>

      {(product.price_enterprise ?? 0) > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Enterprise {formatCurrency(product.price_enterprise!)} —{' '}
          <Link to="/contact" className="text-[var(--brand-blue)] font-medium hover:underline">Contact sales</Link>
        </p>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { product, raw, loading } = usePublicProduct(slug)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('features')
  const [billing, setBilling] = useState<ShopBilling>(() => (
    searchParams.get('buy') === 'yearly' ? 'yearly' : 'monthly'
  ))
  const { buyNow, addProduct } = useCart()
  const { faqs } = useSiteContent('faqs')
  const [productReviews, setProductReviews] = useState<PublicReview[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const screenshot = product
    ? (product.images[0] ? mediaSrc(product.images[0]) : getProductScreenshot(product.slug))
    : (slug ? getProductScreenshot(slug) : undefined)
  const showTrial = product ? productHasFreeTrial(product) : false

  usePageSeo(product ? {
    title: `${product.name} — Software by SoftKatta Solutions`,
    description: product.short_description || product.description?.slice(0, 160) || `Subscribe to ${product.name} from SoftKatta Solutions. GST-ready cloud software for Indian businesses.`,
    path: `/products/${product.slug}`,
    ogType: 'product',
    image: screenshot,
    jsonLd: reviewStats && reviewStats.approved > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
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
    void reviewsApi.productReviews(slug, { per_page: 12 })
      .then((res) => {
        setProductReviews(res.reviews?.data ?? [])
        setReviewStats(res.stats)
      })
      .catch(() => {
        setProductReviews([])
        setReviewStats(null)
      })
      .finally(() => setReviewsLoading(false))
  }, [slug])

  useEffect(() => {
    if (searchParams.get('buy') === 'yearly') setBilling('yearly')
    else if (searchParams.get('buy') === 'monthly') setBilling('monthly')
  }, [searchParams])

  const selectedPlanId = useMemo(() => {
    if (!raw) return ''
    const preferred = searchParams.get('plan')
    const defaultPlan = getDefaultPlan(raw, billing)
    return preferred ?? defaultPlan?.id ?? ''
  }, [raw, billing, searchParams])

  const monthlyPrice = product?.price_monthly ?? 0

  useEffect(() => {
    if (!product) return
    if (product.featureItems.length > 0) {
      setActiveTab('features')
    } else if (faqs.length > 0) {
      setActiveTab('faq')
    }
  }, [product?.id, product?.featureItems.length, faqs.length])

  if (loading) {
    return (
      <PageSection tone="default" className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </PageSection>
    )
  }

  if (!product) {
    return (
      <PageSection tone="default" className="min-h-[60vh] flex items-center">
        <div className="text-center w-full max-w-md mx-auto">
          <h1 className="font-display text-2xl font-bold mb-3">Product not found</h1>
          <Link to="/products" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
        </div>
      </PageSection>
    )
  }

  const purchaseProps = {
    product,
    raw,
    billing,
    onBillingChange: setBilling,
    onBuy: () => buyNow(product.slug, billing, selectedPlanId || undefined),
    onAddToCart: () => void addProduct(product.slug, billing, { planId: selectedPlanId || undefined }),
  }

  const tabs = [
    { key: 'features' as const, label: 'Features', show: product.featureItems.length > 0 },
    { key: 'faq' as const, label: 'FAQ', show: faqs.length > 0 },
    { key: 'reviews' as const, label: 'Reviews', show: true },
  ].filter((t) => t.show)

  const demoVideoUrl = product.demo_video_url ? resolveDemoVideoUrl(product.demo_video_url) : ''
  const demoIsEmbed = demoVideoUrl ? isEmbeddableVideo(product.demo_video_url) : false

  return (
    <div className="product-page">
      <div className="product-page__bg" aria-hidden />

      <section className="product-page__hero relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-10 max-w-6xl">
          <motion.nav {...fadeUp} className="product-page__crumb mb-6">
            <Link to="/products"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-10 xl:gap-14 items-start">
            {/* Left — showcase */}
            <motion.div {...fadeUp} className="min-w-0 space-y-5 order-2 lg:order-1">
              <div className="product-page__browser">
                <div className="product-page__browser-bar">
                  <span className="product-page__browser-dot product-page__browser-dot--red" />
                  <span className="product-page__browser-dot product-page__browser-dot--amber" />
                  <span className="product-page__browser-dot product-page__browser-dot--green" />
                  <span className="product-page__browser-url">{product.slug}.softkatta.in</span>
                </div>
                <div className="product-page__browser-screen">
                  {screenshot ? (
                    <img src={screenshot} alt={`${product.name} preview`} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="product-page__browser-fallback" aria-hidden />
                  )}
                </div>
              </div>

              {demoVideoUrl && (
                <div className="product-page__demo-inline">
                  <p className="product-page__demo-label">Product demo</p>
                  <div className="product-page__browser product-page__browser--video">
                    <div className="product-page__browser-bar">
                      <span className="product-page__browser-dot product-page__browser-dot--red" />
                      <span className="product-page__browser-dot product-page__browser-dot--amber" />
                      <span className="product-page__browser-dot product-page__browser-dot--green" />
                      <span className="product-page__browser-url">Demo video</span>
                    </div>
                    <div className="product-page__demo-frame">
                      {demoIsEmbed ? (
                        <iframe
                          src={demoVideoUrl}
                          className="product-page__demo-iframe"
                          title={`${product.name} demo`}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={demoVideoUrl} controls className="product-page__demo-video" preload="metadata" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {product.featureItems.length > 0 && (
                <ul className="product-page__highlights">
                  {product.featureItems.slice(0, 4).map((f) => (
                    <li key={f.title}><Check className="h-3.5 w-3.5 text-[var(--brand-teal)]" />{f.title}</li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Right — info + buy */}
            <motion.div {...fadeUp} transition={{ delay: 0.06 }} className="order-1 lg:order-2 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="product-page__pill">{product.category}</span>
                  {showTrial && (
                    <span className="product-page__pill product-page__pill--trial">
                      <Sparkles className="h-3 w-3" /> Free trial
                    </span>
                  )}
                  {monthlyPrice > 0 && (
                    <span className="product-page__pill product-page__pill--price">
                      From {formatCurrency(monthlyPrice)}/mo
                    </span>
                  )}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
                  {product.name}
                </h1>
                {reviewStats && reviewStats.approved > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating value={reviewStats.average_rating} readOnly size="sm" showValue />
                    <span className="text-sm text-muted-foreground">
                      {reviewStats.approved} review{reviewStats.approved === 1 ? '' : 's'}
                    </span>
                    <Link to={`/reviews/write?type=product&slug=${product.slug}`} className="text-sm font-medium text-[var(--brand-blue)] hover:underline">
                      Write a review
                    </Link>
                  </div>
                )}
                <p className="text-muted-foreground text-base leading-relaxed">{product.description}</p>
              </div>

              <PurchasePanel {...purchaseProps} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabbed content */}
      {tabs.length > 0 && (
        <PageSection tone="default" className="!py-12 sm:!py-16 !bg-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-0">
            <div className="product-page__tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn('product-page__tab', activeTab === tab.key && 'product-page__tab--active')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {activeTab === 'features' && product.featureItems.length > 0 && (
                <div className="product-page__feature-grid">
                  {product.featureItems.map((feature, i) => (
                    <div key={feature.title} className="product-page__feature" style={{ '--feat-i': i } as React.CSSProperties}>
                      <span className="product-page__feature-icon"><Check className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{feature.title}</p>
                        {feature.description && (
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'faq' && faqs.length > 0 && (
                <div className="space-y-2">
                  {faqs.slice(0, 6).map((faq) => (
                    <div key={faq.id} className={cn('product-page__faq', openFaq === faq.id && 'product-page__faq--open')}>
                      <button
                        type="button"
                        className="product-page__faq-trigger"
                        onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      >
                        {faq.question}
                        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', openFaq === faq.id && 'rotate-180')} />
                      </button>
                      {openFaq === faq.id && <div className="product-page__faq-body">{faq.answer}</div>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {reviewStats && <RatingSummary stats={reviewStats} compact className="flex-1" />}
                    <Link
                      to={`/reviews/write?type=product&slug=${product.slug}`}
                      className="hero-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    >
                      Write a review
                    </Link>
                  </div>
                  <ReviewList
                    reviews={productReviews}
                    loading={reviewsLoading}
                    emptyMessage="No reviews for this product yet. Be the first to share your experience."
                    onHelpful={(uuid) => {
                      void reviewsApi.markHelpful(uuid).then((res) => {
                        setProductReviews((prev) =>
                          prev.map((r) => (r.uuid === uuid ? { ...r, helpful_count: res.helpful_count } : r)),
                        )
                      })
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </PageSection>
      )}

      <section className="product-page__cta mx-4 sm:mx-auto max-w-5xl mb-16 sm:mb-20">
        <div className="product-page__cta-glow" aria-hidden />
        <h2 className="font-display text-2xl font-bold mb-2 relative z-10">Get {product.name} today</h2>
        <p className="text-sm text-muted-foreground mb-6 relative z-10">Instant checkout · GST invoice · Secure payment</p>
        <div className="flex flex-wrap justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => buyNow(product.slug, billing, selectedPlanId || undefined)}
            className="glow-btn inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold"
          >
            <ShoppingBag className="h-4 w-4" /> Buy now
          </button>
          <Link to="/products" className="hero-cta-ghost inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold">
            More products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
