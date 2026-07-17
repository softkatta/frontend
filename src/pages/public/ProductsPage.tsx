import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Package, Sparkles, ShieldCheck, FileCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShopProductCard } from '@/components/common/ShopProductCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { productHasFreeTrial } from '@/lib/productTrial'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Featured' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A–Z' },
]

export default function ProductsPage() {
  const { page } = usePublicPageContent('products')
  const { products, loading, error } = usePublicProducts()
  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortKey>('default')

  const trialCount = useMemo(() => products.filter((p) => productHasFreeTrial(p)).length, [products])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
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

  return (
    <div className="products-store">
      <div className="products-store__bg" aria-hidden />

      <section className="products-store__hero relative overflow-hidden pt-24 pb-10 sm:pb-12">
        <div className="products-store__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="section-label mb-4 inline-block">{page.label}</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.05] mb-4">
              {page.title}{' '}
              {page.highlight && <span className="text-gradient-brand">{page.highlight}</span>}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">{page.description}</p>
          </motion.div>

          {!loading && products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="products-store__stats mt-8 sm:mt-10"
            >
              {[
                { label: 'Products', value: products.length },
                { label: 'Categories', value: Math.max(categories.length - 1, 0) },
                { label: 'Free trials', value: trialCount },
              ].map(({ label, value }) => (
                <div key={label} className="products-store__stat">
                  <span className="products-store__stat-value">{value}</span>
                  <span className="products-store__stat-label">{label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="products-store__toolbar premium-card p-4 sm:p-5 mb-8 sm:mb-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px]">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Label htmlFor="product-search" className="sr-only">Search products</Label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="product-search"
                  placeholder="Search by name or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-11 rounded-xl bg-[var(--background)]/60 border-[var(--border)]"
                />
              </div>

              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Sort by</Label>
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="h-11 rounded-xl bg-[var(--background)]/60">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="products-store__empty">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-display font-bold text-lg mb-1">Could not load products</p>
              <p className="text-sm text-muted-foreground">Check that the backend is running.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="products-store__empty">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-display font-bold text-lg mb-1">No products found</p>
              <button
                type="button"
                onClick={() => { setSearch(''); setCategory('All') }}
                className="text-sm font-semibold text-[var(--brand-blue)] hover:underline mt-3"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
                Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                {category !== 'All' && <> in <span className="text-foreground">{category}</span></>}
              </p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
                {filtered.map((product, i) => (
                  <ShopProductCard
                    key={product.id}
                    slug={product.slug}
                    name={product.name}
                    description={product.short_description || product.description}
                    category={product.category}
                    priceMonthly={product.price_monthly}
                    priceYearly={product.price_yearly}
                    features={product.features}
                    hasFreeTrial={productHasFreeTrial(product)}
                    trialDays={product.trial_days}
                    index={i}
                    imageUrl={product.images[0]}
                  />
                ))}
              </div>
            </>
          )}

          <div className="products-store__trust mt-16 sm:mt-20">
            {[
              { icon: Sparkles, text: 'Free trials available' },
              { icon: FileCheck, text: 'GST-compliant invoices' },
              { icon: ShieldCheck, text: 'Razorpay secure checkout' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="products-store__trust-item">
                <span className="products-store__trust-icon">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-sm text-muted-foreground">
            Need help choosing?{' '}
            <Link to="/pricing" className="text-[var(--brand-blue)] font-semibold hover:underline">Compare pricing</Link>
            {' · '}
            <Link to="/contact" className="text-[var(--brand-blue)] font-semibold hover:underline">Talk to us</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
