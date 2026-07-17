import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart3, type LucideIcon } from 'lucide-react'
import { PageSection } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { usePublicService } from '@/hooks/usePublicServices'
import { usePageSeo } from '@/hooks/usePageSeo'
import { serviceIconKey } from '@/lib/serviceIcons'
import { serviceImageSrc } from '@/lib/serviceImages'

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart: BarChart3,
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const { service, loading, notFound } = usePublicService(slug)

  usePageSeo(service ? {
    title: service.meta_title || `${service.name} — Services | SoftKatta Solutions`,
    description: service.meta_description || service.description?.slice(0, 160) || `${service.name} by SoftKatta Solutions.`,
    path: `/services/${service.slug}`,
    image: serviceImageSrc(service.image),
  } : null)

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
