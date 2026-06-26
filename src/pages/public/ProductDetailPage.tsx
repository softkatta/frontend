import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ChevronDown, Play, ArrowLeft, ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { PageSection } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { usePublicProduct } from '@/hooks/usePublicProducts'
import { getProductScreenshot } from '@/lib/productAssets'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { productHasFreeTrial, productTrialLabel, productTrialRegisterUrl } from '@/lib/productTrial'
import { activePlansForBilling, getDefaultPlan, resolvePlan } from '@/lib/purchasePlan'
import { useSiteContent } from '@/hooks/useSiteContent'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { product, raw, loading } = usePublicProduct(slug)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(
    (searchParams.get('buy') as 'monthly' | 'yearly') || 'monthly',
  )
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const { buyNow, addProduct } = useCart()
  const { faqs } = useSiteContent('below-fold')
  const screenshot = product
    ? (product.images[0] ? resolveMediaUrl(product.images[0]) : getProductScreenshot(product.slug))
    : (slug ? getProductScreenshot(slug) : '')
  const showTrial = product ? productHasFreeTrial(product) : false
  const isTrialLanding = searchParams.get('trial') === '1'

  useEffect(() => {
    const buy = searchParams.get('buy')
    if (buy === 'monthly' || buy === 'yearly') setBilling(buy)
  }, [searchParams])

  const billingPlans = useMemo(
    () => (raw ? activePlansForBilling(raw, billing) : []),
    [raw, billing],
  )

  useEffect(() => {
    if (billingPlans.length === 0) {
      setSelectedPlanId('')
      return
    }
    const preferred = searchParams.get('plan')
    const match = preferred ? billingPlans.find((p) => p.id === preferred) : null
    const defaultPlan = getDefaultPlan(raw, billing)
    setSelectedPlanId(match?.id ?? defaultPlan?.id ?? billingPlans[0]?.id ?? '')
  }, [billing, raw, searchParams, billingPlans])

  const selectedPlan = billingPlans.find((p) => p.id === selectedPlanId)
  const resolvedPlan = raw && selectedPlanId
    ? resolvePlan(raw, billing, selectedPlanId)
    : null

  if (loading) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </PageSection>
    )
  }

  if (!product) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center">
        <div className="text-center w-full">
          <h1 className="font-display text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/products" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Link>
        </div>
      </PageSection>
    )
  }

  const price = resolvedPlan?.price ?? (billing === 'monthly' ? product.price_monthly : product.price_yearly)

  return (
    <div>
      <section className="hero-cyber pt-24 pb-12 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-50" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--brand-blue)] mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All products
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="section-label">{product.category}</span>
              {showTrial && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-teal)]/15 px-3 py-1 text-xs font-semibold text-[var(--brand-teal)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {productTrialLabel(product)}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">{product.name}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{product.description}</p>
            {isTrialLanding && showTrial && (
              <p className="mt-4 text-sm font-medium text-[var(--brand-teal)]">
                Create an account to start your {product.trial_days || 14}-day free trial — no payment required upfront.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <PageSection tone="default" className="!pt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold mb-5">Features</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {product.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card p-6 sm:p-8 overflow-hidden">
              <h2 className="font-display text-xl font-bold mb-5">Product Screenshot</h2>
              <div className="screenshot-frame rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="screenshot-frame__chrome px-4 py-2.5 flex gap-1.5 border-b border-[var(--border)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-blue)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-teal)]" />
                </div>
                <img src={screenshot} alt={`${product.name} dashboard`} className="w-full aspect-video object-cover object-top" />
              </div>
            </div>

            {product.demo_video_url && (
              <div className="premium-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                  <Play className="h-5 w-5 text-[var(--brand-blue)]" /> Demo Video
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden border border-[var(--border)]">
                  <iframe src={product.demo_video_url} className="w-full h-full" title="Demo" allowFullScreen />
                </div>
              </div>
            )}

            {faqs.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">FAQ</h2>
              <div className="space-y-2">
                {faqs.slice(0, 3).map((faq) => (
                  <div key={faq.id} className="premium-card overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold"
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    >
                      {faq.question}
                      <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', openFaq === faq.id && 'rotate-180')} />
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          <div>
            <div className="premium-card sticky top-24 p-6 sm:p-8 shadow-glow-md">
              <Tabs value={billing} onValueChange={(v) => setBilling(v as 'monthly' | 'yearly')}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="flex-1">Yearly</TabsTrigger>
                </TabsList>
                <TabsContent value={billing}>
                  {billingPlans.length > 1 && (
                    <div className="space-y-2 mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select plan</p>
                      {billingPlans.map((plan) => {
                        const active = plan.id === selectedPlanId
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={cn(
                              'w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                              active
                                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/5'
                                : 'border-[var(--border)] hover:border-[var(--brand-blue)]/40',
                            )}
                          >
                            <span className="text-sm font-semibold">
                              {plan.name}
                              {plan.isPopular && (
                                <span className="ml-2 text-[10px] uppercase text-[var(--brand-teal)]">Popular</span>
                              )}
                            </span>
                            <span className="text-sm font-bold">{formatCurrency(plan.price)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <p className="font-display text-4xl font-bold text-brand-gradient">{formatCurrency(price)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan ? `${selectedPlan.name} · ` : ''}
                      per {billing === 'monthly' ? 'month' : 'year'}
                    </p>
                    {billing === 'yearly' && (
                      <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--brand-teal)]/15 text-[var(--brand-teal)]">
                        Save 17%
                      </span>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="space-y-3">
                {showTrial && (
                  <Link
                    to={productTrialRegisterUrl(product.slug)}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold bg-[var(--brand-teal)]/15 text-[var(--brand-teal)] border border-[var(--brand-teal)]/30 hover:bg-[var(--brand-teal)]/25 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start {productTrialLabel(product)}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => buyNow(product.slug, billing, selectedPlanId || undefined)}
                  className="glow-btn flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold"
                >
                  <ShoppingBag className="h-4 w-4" /> Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => addProduct(product.slug, billing, { planId: selectedPlanId || undefined })}
                  className="hero-cta-ghost flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  {showTrial ? 'Free trial available · ' : ''}
                  Login required to purchase · GST invoice included
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
