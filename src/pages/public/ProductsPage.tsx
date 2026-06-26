import { useState, useMemo } from 'react'
import {
  Search, BarChart3, ShoppingCart, Users, Briefcase,
  SlidersHorizontal, Grid3X3, Package, Tag, ArrowUpDown, X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ShopProductCard } from '@/components/common/ShopProductCard'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import { productHasFreeTrial } from '@/lib/productTrial'
import { cn } from '@/lib/utils'

const PRODUCT_ICONS = [BarChart3, ShoppingCart, Users, Briefcase]

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'name'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A–Z' },
]

export default function ProductsPage() {
  const { products, loading, error } = usePublicProducts()
  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortKey>('popular')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'All' || p.category === category
      return matchSearch && matchCategory
    })

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price_monthly - b.price_monthly)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price_monthly - a.price_monthly)
        break
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }
    return list
  }, [search, category, sort, products])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length }
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    })
    return counts
  }, [products])

  return (
    <div>
      {/* Shop hero */}
      <section className="hero-cyber pt-24 pb-14 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="SoftKatta Store"
            title="Software"
            highlight="Shop"
            description="Browse SaaS products, compare plans, and subscribe instantly — GST invoices included."
          />
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { icon: Package, text: `${products.length} Products` },
              { icon: ShoppingCart, text: 'Instant checkout' },
              { icon: Tag, text: 'GST invoicing' },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-sm text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--brand-blue)]" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <PageSection tone="default" className="!pt-6 !pb-16 products-shop-section">
        <div className="shop-layout grid lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block">
            <div className="shop-sidebar sticky top-24 space-y-6">
              <div>
                <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--brand-blue)]" /> Categories
                </h3>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          'shop-sidebar__link w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                          category === cat && 'shop-sidebar__link--active',
                        )}
                      >
                        <span>{cat}</span>
                        <span className="text-xs opacity-70 tabular-nums">{categoryCounts[cat] ?? 0}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shop-sidebar__promo rounded-2xl p-4 border border-[var(--border)]">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-blue)] mb-1">Bundle offer</p>
                <p className="text-sm font-display font-bold mb-2">Get 20% off on 2+ products</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Combine ERP + POS or any two plans at checkout.
                </p>
              </div>
            </div>
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} aria-label="Close filters" />
              <div className="absolute left-0 top-0 bottom-0 w-72 shop-sidebar p-6 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold">Filters</h3>
                  <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => { setCategory(cat); setSidebarOpen(false) }}
                        className={cn(
                          'shop-sidebar__link w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium',
                          category === cat && 'shop-sidebar__link--active',
                        )}
                      >
                        <span>{cat}</span>
                        <span className="text-xs opacity-70">{categoryCounts[cat] ?? 0}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Main shop area */}
          <div className="min-w-0">
            {/* Toolbar */}
            <div className="shop-toolbar flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in store..."
                  className="pl-11 h-11 rounded-xl bg-[var(--input-background)] border-[var(--border)]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden shop-toolbar__btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </button>

                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="shop-toolbar__select appearance-none pl-10 pr-8 py-2.5 rounded-xl text-sm font-semibold cursor-pointer min-w-[160px]"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-muted/40">
                  <Grid3X3 className="h-3.5 w-3.5" />
                  {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* Mobile category pills */}
            <div className="flex gap-2 flex-wrap mb-6 lg:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
                    category === cat
                      ? 'bg-brand-gradient text-white border-transparent shadow-glow-sm'
                      : 'border-[var(--border)] text-muted-foreground bg-[var(--card)]',
                  )}
                >
                  {cat} ({categoryCounts[cat] ?? 0})
                </button>
              ))}
            </div>

            {/* Product grid — shop style */}
            {filtered.length > 0 ? (
              <div className="shop-product-grid grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {filtered.map((product, i) => (
                  <ShopProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    description={product.short_description}
                    category={product.category}
                    priceMonthly={product.price_monthly}
                    priceYearly={product.price_yearly}
                    monthlyPlanName={product.monthly_plan_name}
                    defaultMonthlyPlanId={product.default_monthly_plan_id}
                    hasFreeTrial={productHasFreeTrial(product)}
                    trialDays={product.trial_days}
                    icon={PRODUCT_ICONS[i % PRODUCT_ICONS.length]}
                    index={i}
                    featured={i === 0}
                    imageUrl={product.images[0]}
                  />
                ))}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="shop-empty text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--border)]">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="font-display font-bold text-lg mb-1">Could not load products</p>
                <p className="text-sm text-muted-foreground">Check that the backend is running and products are active in admin.</p>
              </div>
            ) : (
              <div className="shop-empty text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--border)]">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="font-display font-bold text-lg mb-1">No products found</p>
                <p className="text-sm text-muted-foreground mb-4">Try a different search or category.</p>
                <button
                  type="button"
                  onClick={() => { setSearch(''); setCategory('All') }}
                  className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </PageSection>
    </div>
  )
}
