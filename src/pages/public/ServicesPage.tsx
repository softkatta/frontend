import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ServiceCard } from '@/components/common/ServiceCard'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { usePublicServices } from '@/hooks/usePublicServices'
import { serviceIconKey } from '@/lib/serviceIcons'
import { hasServiceImage, serviceImageSrc } from '@/lib/serviceImages'

export default function ServicesPage() {
  const { page, loading: pageLoading } = usePublicPageContent('services')
  const { services, loading: servicesLoading } = usePublicServices()
  const loading = pageLoading || servicesLoading

  return (
    <div className="services-page">
      <div className="services-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10 sm:pb-12">
        <div className="services-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="section-label mb-4 inline-block">{page.label}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4 text-[var(--text-hero,var(--foreground))]">
              {page.title}{' '}
              {page.highlight && <span className="text-gradient-brand">{page.highlight}</span>}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{page.description}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <h2 className="services-page__section-title font-display text-2xl sm:text-3xl font-bold mb-10">Our Services</h2>
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground">No services published yet.</p>
          ) : (
            <div className="services-page__grid">
              {services.map((service, i) => (
                <motion.div
                  key={service.slug}
                  id={service.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.05 }}
                  className="h-full"
                >
                  <ServiceCard
                    slug={service.slug}
                    title={service.name}
                    description={service.description ?? ''}
                    icon={serviceIconKey(service.icon)}
                    image={hasServiceImage(service.image) ? serviceImageSrc(service.image) : undefined}
                    index={i}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {(page.why_choose_items?.length ?? 0) > 0 && (
        <section className="services-page__why-section pb-20 sm:pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="services-page__why-card"
            >
              <h2 className="services-page__why-title">
                {page.why_choose_title || 'Why Choose SoftKatta Solutions?'}
              </h2>
              <ul className="services-page__why-grid">
                {page.why_choose_items!.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="services-page__why-item"
                  >
                    <span className="services-page__why-check" aria-hidden>
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="services-page__cta"
            >
              <p className="services-page__cta-text">{page.cta_text}</p>
              <Link to="/contact" className="services-page__cta-btn">
                Get a Free Consultation <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {(page.why_choose_items?.length ?? 0) === 0 && (
      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl text-center">
          <p className="text-muted-foreground mb-5 max-w-2xl mx-auto">{page.cta_text}</p>
          <Link to="/contact" className="glow-btn inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
            Get a Free Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      )}
    </div>
  )
}
