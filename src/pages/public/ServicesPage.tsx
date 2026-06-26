import { motion } from 'framer-motion'
import { Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart3, type LucideIcon } from 'lucide-react'
import { SiteCard } from '@/components/common/SiteCard'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { usePublicServices } from '@/hooks/usePublicServices'
import { serviceIconKey } from '@/lib/serviceIcons'

const iconMap: Record<string, LucideIcon> = {
  Code, Cloud, Lightbulb, Rocket, Shield, Palette, BarChart: BarChart3,
}

const ACCENTS = ['cyan', 'violet', 'emerald', 'purple'] as const

export default function ServicesPage() {
  const { services, loading } = usePublicServices()

  return (
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="What We Offer"
            title="Our"
            highlight="Services"
            description="Comprehensive technology services to accelerate your digital transformation."
          />
        </div>
      </section>

      <PageSection tone="default">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : services.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No services available yet.</p>
        ) : (
          <div className="services-card-grid grid md:grid-cols-2 gap-6">
            {services.map((service, i) => {
              const Icon = iconMap[serviceIconKey(service.icon)] || Code
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <SiteCard
                    index={i}
                    accent={ACCENTS[i % ACCENTS.length]}
                    title={service.name}
                    description={service.description ?? ''}
                    icon={Icon}
                    ctaLabel="View details"
                    href={`/services/${service.slug}`}
                  />
                </motion.div>
              )
            })}
          </div>
        )}
      </PageSection>
    </div>
  )
}
