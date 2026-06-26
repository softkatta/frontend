import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, Eye, Heart, Users, MapPin, Award, ArrowRight } from 'lucide-react'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { useAboutContent } from '@/hooks/useAboutContent'
import { cn } from '@/lib/utils'

const VALUE_ICONS = [Target, Eye, Heart, Users] as const
const VALUE_ACCENTS = ['#2563eb', '#14b8a6', '#6366f1', '#0891b2'] as const

export default function AboutPage() {
  const { companyName, companyTagline, companyAddress } = useSiteBranding()
  const about = useAboutContent()

  const values = about.values.length > 0 ? about.values : []
  const milestones = about.milestones.length > 0 ? about.milestones : []

  return (
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="Our Story"
            title="About"
            highlight={companyName}
            description={companyTagline || 'Building cloud software that businesses actually use.'}
          />
        </div>
      </section>

      <PageSection tone="default" className="!pt-8">
        <div className="about-intro grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="glow-card-highlight p-8 sm:p-10 rounded-3xl">
              <Award className="glow-card-highlight__icon h-10 w-10 mb-4" />
              <h2 className="glow-card-highlight__title font-display text-2xl sm:text-3xl font-bold mb-4">
                {about.highlightTitle || "Made for Bharat's SMEs"}
              </h2>
              <p className="glow-card-highlight__desc text-sm sm:text-base leading-relaxed">
                {about.highlightText || companyTagline}
              </p>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            {about.storyText || (
              <>
                {companyName} is a multi-tenant SaaS company helping Indian enterprises digitize operations.
                {companyTagline ? ` ${companyTagline}` : ''}
              </>
            )}
          </motion.p>
        </div>

        {values.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20 max-w-6xl mx-auto">
            {values.map(({ title, description }, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length]
              const accent = VALUE_ACCENTS[i % VALUE_ACCENTS.length]
              return (
                <motion.div
                  key={`${title}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="about-value-card premium-card p-6 rounded-2xl text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ background: `${accent}15` }}>
                    <Icon className="h-7 w-7" style={{ color: accent }} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </motion.div>
              )
            })}
          </div>
        )}

        {milestones.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-10">Our Journey</h2>
            <div className="about-timeline space-y-0 relative before:absolute before:left-4 sm:before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-[var(--border)]">
              {milestones.map((m, i) => (
                <motion.div
                  key={`${m.year}-${m.title}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'relative flex flex-col sm:flex-row gap-4 pb-10 pl-12 sm:pl-0',
                    i % 2 === 0 ? 'sm:flex-row-reverse sm:text-right' : '',
                  )}
                >
                  <div className="sm:w-1/2" />
                  <div className="absolute left-2.5 sm:left-1/2 sm:-translate-x-1/2 top-1 h-3 w-3 rounded-full bg-brand-gradient ring-4 ring-[var(--background)]" />
                  <div className={cn('sm:w-1/2 premium-card p-5 rounded-xl', i % 2 === 0 ? 'sm:mr-auto sm:pr-8' : 'sm:ml-auto sm:pl-8')}>
                    <p className="font-display text-2xl font-bold text-brand-gradient">{m.year}</p>
                    <p className="font-semibold mt-1">{m.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/contact" className="glow-btn inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
            Work With Us <ArrowRight className="h-4 w-4" />
          </Link>
          {companyAddress && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-4">
              <MapPin className="h-4 w-4" /> {companyAddress}
            </p>
          )}
        </div>
      </PageSection>
    </div>
  )
}
