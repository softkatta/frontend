import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, ExternalLink } from 'lucide-react'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import {
  PORTFOLIO_FILTERS,
  PORTFOLIO_ITEMS,
  type PortfolioCategory,
  type PortfolioItem,
} from '@/lib/portfolio'
import { STATIC_PAGE_SEO } from '@/lib/seo/siteSeo'
import { cn } from '@/lib/utils'

function mergeWithLiveProducts(
  items: PortfolioItem[],
  products: Array<{ slug: string }>,
): PortfolioItem[] {
  const slugs = new Set(products.map((p) => p.slug))

  return items.map((item) => {
    if (!item.href?.startsWith('/products/')) return item
    const slug = item.href.replace('/products/', '')
    if (slugs.has(slug)) return item

    const fuzzy = products.find(
      (p) => p.slug.includes(item.id) || item.id.split('-').every((part) => p.slug.includes(part)),
    )
    if (fuzzy) {
      return { ...item, href: `/products/${fuzzy.slug}`, cta: 'View product' }
    }

    return { ...item, href: '/products', cta: 'Browse products' }
  })
}

export default function PortfolioPage() {
  const { companyName } = useSiteBranding()
  const { products } = usePublicProducts()
  const [filter, setFilter] = useState<PortfolioCategory>('all')
  const seo = STATIC_PAGE_SEO['/portfolio']

  usePageSeo(seo ? { ...seo, path: '/portfolio' } : null)

  const items = useMemo(
    () => mergeWithLiveProducts(PORTFOLIO_ITEMS, products),
    [products],
  )

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [filter, items],
  )

  const brand = companyName || 'SoftKatta Solutions'

  return (
    <div className="portfolio-page">
      <div className="portfolio-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10 sm:pb-12">
        <div className="portfolio-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              Portfolio
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
              {brand}{' '}
              <span className="text-gradient-brand">work & products</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
              SaaS products and custom software we build for education, healthcare, retail, and growing businesses across India.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="glow-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
                Start a project <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-5 py-2.5 text-sm font-semibold hover:border-[var(--brand-teal)]/40 transition-colors"
              >
                Software shop
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="portfolio-page__filters" role="tablist" aria-label="Filter portfolio">
            {PORTFOLIO_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={filter === item.key}
                className={cn(
                  'portfolio-page__filter',
                  filter === item.key && 'portfolio-page__filter--active',
                )}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="portfolio-page__grid">
            {filtered.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.45 }}
                className="portfolio-page__item"
                style={{ '--portfolio-accent': item.accent } as CSSProperties}
              >
                <div className="portfolio-page__item-beam" aria-hidden />
                <p className="portfolio-page__industry">{item.industry}</p>
                <h2 className="font-display text-xl font-bold tracking-tight mb-2">{item.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{item.summary}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="portfolio-page__tag">{tag}</span>
                  ))}
                </div>
                {item.href ? (
                  <Link to={item.href} className="portfolio-page__link">
                    {item.cta || 'Learn more'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </motion.article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No projects in this category yet.</p>
          )}
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="portfolio-page__cta"
          >
            <div className="portfolio-page__cta-glow" aria-hidden />
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Have a project in mind?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Tell us about your institute, store, clinic, or business — we will recommend a SoftKatta product or a custom build.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" className="glow-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--brand-teal)]/40 transition-colors"
                >
                  View services
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
