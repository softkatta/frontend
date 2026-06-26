import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Sparkles, ShoppingBag, CreditCard } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import { activePlansForBilling } from '@/lib/purchasePlan'
import { asRecord, asString } from '@/lib/apiHelpers'

type PricingCard = {
  id: string
  productSlug: string
  productName: string
  name: string
  description: string
  price: number
  features: string[]
  isPopular: boolean
}

function mapPricingCards(rawProducts: unknown[], billing: 'monthly' | 'yearly'): PricingCard[] {
  return rawProducts.flatMap((raw) => {
    const product = asRecord(raw)
    const slug = asString(product.slug)
    const productName = asString(product.name)
    const overview = asString(product.overview ?? product.description)

    return activePlansForBilling(raw, billing).map((plan) => ({
      id: plan.id,
      productSlug: slug,
      productName,
      name: plan.name,
      description: overview,
      price: plan.price,
      features: Array.isArray(product.features)
        ? product.features.map((f) => asString(asRecord(f).title ?? asRecord(f).name ?? f))
        : plan.name
          ? [`${productName} — ${plan.name}`]
          : [],
      isPopular: plan.isPopular,
    }))
  })
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly' | 'enterprise'>('monthly')
  const { isAuthenticated, hasRole } = useAuth()
  const { rawProducts, loading, error } = usePublicProducts()
  const isClient = isAuthenticated && hasRole('client')

  const planCards = useMemo(
    () => (billing === 'enterprise' ? [] : mapPricingCards(rawProducts, billing)),
    [rawProducts, billing],
  )

  const planCta = (card: PricingCard) => {
    const target = `/products/${card.productSlug}?plan=${card.id}&buy=${billing}`
    if (isClient) return target
    return `/register?redirect=${encodeURIComponent(target)}`
  }

  return (
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-50" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="Pricing Plans"
            title="Choose Your"
            highlight="Plan"
            description="All plans are managed in admin — prices shown here match checkout exactly."
          />
          {isClient && (
            <p className="text-center text-sm text-[var(--brand-teal)] font-semibold flex items-center justify-center gap-2 -mt-6 mb-4">
              <CreditCard className="h-4 w-4" />
              You&apos;re logged in — manage plans in{' '}
              <Link to="/dashboard/subscriptions" className="underline">Subscriptions</Link>
            </p>
          )}
        </div>
      </section>

      <PageSection tone="default" className="!pt-4">
        <Tabs value={billing} onValueChange={(v) => setBilling(v as typeof billing)} className="max-w-6xl mx-auto">
          <TabsList className="pricing-tabs-list grid w-full max-w-md mx-auto grid-cols-3 mb-14 h-12 p-1 rounded-2xl">
            <TabsTrigger value="monthly" className="pricing-tab rounded-xl font-semibold">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="pricing-tab rounded-xl font-semibold">Yearly</TabsTrigger>
            <TabsTrigger value="enterprise" className="pricing-tab rounded-xl font-semibold">Enterprise</TabsTrigger>
          </TabsList>

          {(['monthly', 'yearly'] as const).map((period) => (
            <TabsContent key={period} value={period}>
              {loading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error || planCards.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  No {period} plans configured in admin yet.
                </div>
              ) : (
                <div className="pricing-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch pt-4">
                  {planCards.map((plan, i) => (
                    <div
                      key={plan.id}
                      className={cn(
                        'pricing-card premium-card rounded-3xl p-6 sm:p-8 flex flex-col h-full relative',
                        plan.isPopular && 'pricing-card--popular glow-card border-[rgba(30,64,175,0.35)] md:-mt-2 md:mb-2 overflow-visible',
                        !plan.isPopular && 'overflow-hidden',
                      )}
                      style={{ '--card-i': i } as React.CSSProperties}
                    >
                      {plan.isPopular && (
                        <span className="pricing-card__badge absolute left-1/2 -translate-x-1/2 -top-3 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-gradient text-white shadow-glow-sm whitespace-nowrap">
                          <Sparkles className="h-3 w-3" /> Most Popular
                        </span>
                      )}
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--brand-blue)] mb-1">
                        {plan.productName}
                      </p>
                      <h3 className="font-display text-xl font-bold mb-1 mt-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{plan.description}</p>
                      <p className="font-display text-4xl font-bold text-brand-gradient mb-1">
                        {formatCurrency(plan.price)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        per {period === 'monthly' ? 'month' : 'year'}
                      </p>
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.slice(0, 6).map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to={planCta(plan)}
                        className={cn(
                          'inline-flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition-all',
                          plan.isPopular ? 'glow-btn' : 'hero-cta-ghost',
                        )}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {isClient ? 'Select plan' : 'Create Account & Buy'}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}

          <TabsContent value="enterprise">
            <div className="glow-card max-w-2xl mx-auto p-10 sm:p-12 text-center rounded-3xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient mx-auto mb-5">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-3">Enterprise Plan</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Custom solutions with dedicated support, SLA guarantees, and on-premise options.
              </p>
              <Link to="/contact" className="hero-cta-primary inline-flex px-8 py-3.5 text-sm rounded-full">
                Contact Sales Team
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </PageSection>
    </div>
  )
}
