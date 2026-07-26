import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Package,
  Sparkles,
  ShieldCheck,
  Users,
  GraduationCap,
  Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn, formatCurrency } from '@/lib/utils'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { productHasFreeTrial } from '@/lib/productTrial'
import { getDefaultPlan, yearlySavingsPercent } from '@/lib/purchasePlan'

type Billing = 'monthly' | 'yearly'

export default function PricingPage() {
  const { page } = usePublicPageContent('pricing')
  const trustItems = page.trust_items ?? []
  const { products, rawProducts, loading, error } = usePublicProducts()
  const [billing, setBilling] = useState<Billing>('monthly')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const activeProducts = useMemo(
    () => products
      .map((product, index) => ({ product, raw: rawProducts[index] }))
      .filter(({ product }) => product.is_active),
    [products, rawProducts],
  )

  const categories = useMemo(
    () => ['All', ...new Set(activeProducts.map(({ product }) => product.category))],
    [activeProducts],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activeProducts.filter(({ product }) => {
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.short_description?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      const matchCategory = category === 'All' || product.category === category
      return matchSearch && matchCategory
    })
  }, [activeProducts, search, category])

  const plans = useMemo(() => {
    return filteredProducts.map(({ product, raw }, index) => {
      const selectedPlan = getDefaultPlan(raw, billing)
      const price = selectedPlan?.price ?? (billing === 'yearly' ? product.price_yearly : product.price_monthly)
      const savings = yearlySavingsPercent(product.price_monthly, product.price_yearly)
      return {
        product,
        selectedPlan,
        price,
        savings,
        popular: index === 0,
      }
    })
  }, [filteredProducts, billing])

  const hasYearlyPricing = filteredProducts.some(({ raw }) => (getDefaultPlan(raw, 'yearly')?.price ?? 0) > 0)

  return (
    <div className="pricing-page">
      <div className="pricing-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10 sm:pb-12">
        <div className="pricing-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="section-label mb-4 inline-block">{page.label}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
              {page.title}{' '}
              {page.highlight && <span className="text-gradient-brand">{page.highlight}</span>}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">{page.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="pricing-page__trust-row mt-8"
          >
            {trustItems.map((item) => (
              <span key={item} className="pricing-page__trust-pill">
                <ShieldCheck className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
            <div className="min-w-0 flex-1">
              <Label htmlFor="pricing-search" className="sr-only">Search products</Label>
              <Input
                id="pricing-search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-lg rounded-full bg-[var(--background)]/70 border-[var(--border)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[180px]">
                <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-[var(--background)]/60">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs font-semibold text-muted-foreground">Billing</Label>
                <Select value={billing} onValueChange={(value) => setBilling(value as Billing)}>
                  <SelectTrigger className="h-11 rounded-xl bg-[var(--background)]/60">
                    <SelectValue placeholder="Billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    {hasYearlyPricing && <SelectItem value="yearly">Yearly</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : error || filteredProducts.length === 0 ? (
            <div className="pricing-page__empty">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="font-semibold mb-1">No pricing published yet</p>
              <p className="text-sm text-muted-foreground mb-6">Browse the software shop or contact us for a quote.</p>
              <Link to="/products" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full">
                Browse products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  {category !== 'All' && <> in <span className="text-foreground">{category}</span></>}
                </p>
                {search || category !== 'All' ? (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setCategory('All') }}
                    className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
              <div className="pricing-page__grid">
                {plans.map(({ product, selectedPlan, price, savings, popular }, i) => (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn('pricing-page__card', popular && 'pricing-page__card--popular')}
                  >
                  {popular && (
                    <span className="pricing-page__popular-badge">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </span>
                  )}

                  <div className="pricing-page__card-head">
                    <p className="pricing-page__category">{product.category}</p>
                    <h3 className="font-display font-bold text-xl">{product.name}</h3>
                    {selectedPlan?.name ? (
                      <p className="pricing-page__plan-name">{selectedPlan.name}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{product.short_description}</p>
                  </div>

                  <div className="pricing-page__price-block">
                    {price > 0 ? (
                      <>
                        <span className="pricing-page__price">{formatCurrency(price)}</span>
                        <span className="pricing-page__cycle">/{billing === 'yearly' ? 'year' : 'mo'}</span>
                      </>
                    ) : (
                      <span className="font-display text-2xl font-bold">Contact us</span>
                    )}
                    {billing === 'yearly' && savings > 0 && (
                      <span className="pricing-page__save">Save {savings}% vs monthly</span>
                    )}
                  </div>

                  {productHasFreeTrial(product) && (
                    <span className="pricing-page__trial">
                      <Zap className="h-3.5 w-3.5" /> Free trial available
                    </span>
                  )}

                  {(selectedPlan?.maxUsers !== undefined || selectedPlan?.maxStudents !== undefined) && (
                    <div className="pricing-page__limits" aria-label={`${product.name} plan limits`}>
                      {selectedPlan?.maxUsers !== undefined && (
                        <span><Users className="h-3.5 w-3.5" />{selectedPlan.maxUsers} users</span>
                      )}
                      {selectedPlan?.maxStudents !== undefined && (
                        <span><GraduationCap className="h-3.5 w-3.5" />{selectedPlan.maxStudents} students</span>
                      )}
                    </div>
                  )}

                  {product.features.length > 0 && (
                    <ul className="pricing-page__features">
                      {product.features.slice(0, 5).map((feature) => (
                        <li key={feature}>
                          <Check className="h-3.5 w-3.5 text-[var(--brand-teal)] shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    to={`/products/${product.slug}?buy=${billing}`}
                    className={cn('pricing-page__cta', popular && 'pricing-page__cta--primary')}
                  >
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.article>
              ))}
            </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-10">
            Need help choosing?{' '}
            <Link to="/contact" className="text-[var(--brand-blue)] font-semibold hover:underline">
              Talk to our team
            </Link>
            {' '}or{' '}
            <Link to="/products" className="text-[var(--brand-blue)] font-semibold hover:underline">
              compare all products
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
