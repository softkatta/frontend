import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, ChevronDown, Phone,
} from 'lucide-react'
import { ShopProductCard } from '@/components/common/ShopProductCard'
import { TestimonialCarousel } from '@/components/common/TestimonialCarousel'
import { ServiceCard } from '@/components/common/ServiceCard'
import { HomeDemoVideoSection } from '@/components/public/HomeDemoVideoSection'
import { HomeTechnologySection } from '@/components/public/HomeTechnologySection'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useHomeSections } from '@/hooks/useHomeSections'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import { usePublicServices } from '@/hooks/usePublicServices'
import { serviceIconKey } from '@/lib/serviceIcons'
import { hasServiceImage, serviceImageSrc } from '@/lib/serviceImages'
import { productHasFreeTrial } from '@/lib/productTrial'
import { getLatestProductWithDemo } from '@/lib/latestProductDemo'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { whyCardIcon } from '@/lib/whyCardIcons'
import { cn } from '@/lib/utils'

const DEFAULT_WHY_HIGHLIGHT = {
  stat: 'India',
  title: 'Built for Indian businesses',
  description: 'From coaching institutes and medical stores to nursery schools and hospitals — secure, scalable ERP and custom software from Talni, Nanded.',
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: 'easeOut' as const },
}

export default function HomeBelowFold() {
  const { page } = usePublicPageContent('home')
  const sections = page.sections ?? {}
  const productsSection = sections.products ?? {}
  const servicesSection = sections.services ?? {}
  const whySection = sections.why ?? {}
  const whyHighlight = page.why_highlight ?? DEFAULT_WHY_HIGHLIGHT
  const whyCards = page.why_cards ?? []
  const faqSection = sections.faq ?? {}
  const { products } = usePublicProducts()
  const { services } = usePublicServices()
  const { sections: homeSections } = useHomeSections()
  const { testimonials, faqs } = useSiteContent('below-fold')
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const featuredProducts = products.filter((p) => p.is_active).slice(0, 4)

  const latestProductDemo = useMemo(() => getLatestProductWithDemo(products), [products])

  return (
    <>
      <PageSection tone="default">
        <motion.div {...fadeUp}>
          <SectionHeaderBlock
            label={productsSection.label ?? ''}
            title={productsSection.title ?? ''}
            highlight={productsSection.highlight}
            description={productsSection.description}
          />
        </motion.div>
        <div className="home-products-grid">
          {featuredProducts.map((product, i) => (
            <ShopProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              description={product.short_description}
              category={product.category}
              priceMonthly={product.price_monthly}
              priceYearly={product.price_yearly}
              features={product.features}
              hasFreeTrial={productHasFreeTrial(product)}
              index={i}
              imageUrl={product.images[0]}
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/products" className="hero-cta-ghost inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full">
            View Full Shop <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>

      <HomeDemoVideoSection
        config={homeSections.demo_video}
        productDemo={
          latestProductDemo?.demo_video_url
            ? {
                name: latestProductDemo.name,
                slug: latestProductDemo.slug,
                videoUrl: latestProductDemo.demo_video_url,
              }
            : undefined
        }
      />

      {services.length > 0 && (
      <PageSection tone="muted">
        <motion.div {...fadeUp}>
          <SectionHeaderBlock
            label={servicesSection.label ?? ''}
            title={servicesSection.title ?? ''}
            highlight={servicesSection.highlight}
            description={servicesSection.description}
          />
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.slice(0, 6).map((s, i) => (
            <ServiceCard
              key={s.id}
              slug={s.slug}
              title={s.name}
              description={s.description ?? ''}
              icon={serviceIconKey(s.icon)}
              image={hasServiceImage(s.image) ? serviceImageSrc(s.image) : undefined}
              index={i}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/services" className="text-sm font-semibold text-[var(--brand-blue)] inline-flex items-center gap-1 hover:gap-2 transition-all">
            View all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
      )}

      <HomeTechnologySection items={homeSections.technologies} />

      <PageSection tone="card">
        <motion.div {...fadeUp}>
          <SectionHeaderBlock
            label={whySection.label ?? ''}
            title={whySection.title ?? ''}
            highlight={whySection.highlight}
            description={whySection.description}
          />
        </motion.div>
        <div className="why-softkatta-grid grid lg:grid-cols-12 gap-5 max-w-6xl mx-auto">
          <motion.div
            {...fadeUp}
            className="lg:col-span-5 glow-card-highlight p-8 sm:p-10 rounded-3xl flex flex-col justify-center"
          >
            <p className="glow-card-highlight__stat text-5xl sm:text-6xl font-display font-bold mb-2">{whyHighlight.stat}</p>
            <p className="glow-card-highlight__title text-lg font-semibold mb-4">{whyHighlight.title}</p>
            <p className="glow-card-highlight__desc text-sm leading-relaxed">
              {whyHighlight.description}
            </p>
          </motion.div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {whyCards.map((card, i) => {
              const Icon = whyCardIcon(card.icon)
              const color = card.color || '#2563eb'
              return (
              <motion.div
                key={`${card.title}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="why-softkatta-card premium-card p-6 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: color }} />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ background: `${color}18` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h4 className="font-display font-bold mb-1.5 text-[var(--text-hero)]">{card.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </motion.div>
              )
            })}
          </div>
        </div>
      </PageSection>

      {testimonials.length > 0 && (
      <PageSection tone="default" className="testimonials-glass-section">
        <div className="testimonials-glass-stage p-8 sm:p-12 rounded-3xl">
          <div className="testimonials-glass-stage__bg" aria-hidden />
          <div className="testimonials-glass-orb testimonials-glass-orb--1" aria-hidden />
          <div className="testimonials-glass-orb testimonials-glass-orb--2" aria-hidden />
          <div className="relative z-10">
            <SectionHeaderBlock label="Testimonials" title="Loved by" highlight="Business Owners" />
            <TestimonialCarousel items={testimonials} />
          </div>
        </div>
      </PageSection>
      )}

      {faqs.length > 0 && (
      <PageSection tone="muted" className="!py-16 sm:!py-20">
        <SectionHeaderBlock
          label={faqSection.label ?? ''}
          title={faqSection.title ?? ''}
          highlight={faqSection.highlight}
          description={faqSection.description}
          className="mb-8"
        />
        <div className="faq-accordion-v2 faq-accordion-v2--stack max-w-3xl mx-auto">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === faq.id
            return (
              <div
                key={faq.id}
                className={cn('faq-accordion-v2__item', isOpen && 'faq-accordion-v2__item--open')}
              >
                <button
                  type="button"
                  className="faq-accordion-v2__trigger"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-accordion-v2__index-wrap">
                    <span className="faq-accordion-v2__index">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="faq-accordion-v2__question">{faq.question}</span>
                  <span className={cn('faq-accordion-v2__chevron-wrap', isOpen && 'faq-accordion-v2__chevron-wrap--open')}>
                    <ChevronDown className="faq-accordion-v2__chevron h-4 w-4" />
                  </span>
                </button>
                <div className={cn('faq-accordion-v2__panel', isOpen && 'faq-accordion-v2__panel--open')}>
                  <div className="faq-accordion-v2__panel-inner">
                    <p className="faq-accordion-v2__answer">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </PageSection>
      )}

      <PageSection tone="card" className="!py-10 sm:!py-12 pb-16">
        <div className="cta-compact relative overflow-hidden rounded-2xl max-w-5xl mx-auto">
          <div className="cta-compact__bg" aria-hidden />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 px-6 py-6 sm:px-8 sm:py-7">
            <div className="text-center sm:text-left min-w-0">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                Ready to Transform Your Business?
              </h2>
              <p className="text-sm text-blue-100/85 leading-relaxed">
                GST invoices · Instant setup · Secure cloud
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-[var(--brand-blue)] text-sm font-semibold shadow-lg hover:scale-[1.02] transition-transform whitespace-nowrap"
              >
                Create Account <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-white/35 text-white text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <Phone className="h-3.5 w-3.5" /> Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </PageSection>
    </>
  )
}
