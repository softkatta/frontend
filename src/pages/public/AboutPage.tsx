import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target,
  Eye,
  MapPin,
  Award,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
  Heart,
  Users,
  Phone,
  Building2,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { useAboutContent } from '@/hooks/useAboutContent'
import { usePageSeo } from '@/hooks/usePageSeo'
import { phoneTelHref } from '@/lib/companyContact'

const VALUE_ICONS = [Sparkles, Award, Heart, Users, Shield, TrendingUp] as const
const VALUE_ACCENTS = ['#2563eb', '#14b8a6', '#6366f1', '#0891b2', '#7c3aed', '#0d9488'] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5 },
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

export default function AboutPage() {
  const { companyName, companyAddress, companyPhone, companyWebsite } = useSiteBranding()
  const about = useAboutContent()

  usePageSeo({
    title: `About ${companyName || 'SoftKatta Solutions'}`,
    description: about.heroDescription || about.highlightText || `Learn about ${companyName || 'SoftKatta Solutions'} — custom software and ERP development from Nanded, Maharashtra.`,
    path: '/about',
  })

  const values = about.values.length > 0 ? about.values : []
  const milestones = about.milestones.length > 0 ? about.milestones : []
  const storyParagraphs = splitParagraphs(about.storyText)

  if (about.loading) {
    return (
      <div className="about-page min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="about-page">
      <div className="about-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-12 sm:pb-16">
        <div className="about-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <span className="hero-eyebrow">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--brand-teal)]" aria-hidden />
              <span>{about.heroLabel || 'About SoftKatta Solutions'}</span>
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08] mb-4">
              {about.heroTitle || 'Building Smart Software Solutions for'}{' '}
              <span className="text-brand-gradient">{about.heroHighlight || 'Modern Businesses'}</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
              {about.heroDescription || about.highlightText}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="about-page__story-grid">
            <motion.aside {...fadeUp} className="about-page__highlight-card">
              <div className="about-page__highlight-glow" aria-hidden />
              <div className="relative z-10">
                <div className="about-page__highlight-icon">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">
                  {about.highlightTitle || 'Our Story'}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {about.highlightText}
                </p>
                {companyAddress && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground mt-6 pt-6 border-t border-[var(--border)]">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[var(--brand-teal)]" />
                    <span>{companyAddress}</span>
                  </p>
                )}
              </div>
            </motion.aside>

            <motion.div {...fadeUp} transition={{ delay: 0.06 }} className="about-page__story-body">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6">Who We Are</h2>
              <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                {storyParagraphs.length > 0 ? (
                  storyParagraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))
                ) : (
                  <p>{about.storyText}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {(about.missionText || about.visionText) && (
        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="about-page__mv-grid">
              {about.missionText && (
                <motion.article {...fadeUp} className="about-page__mv-card">
                  <div className="about-page__mv-icon about-page__mv-icon--mission">
                    <Target className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-3">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">{about.missionText}</p>
                </motion.article>
              )}
              {about.visionText && (
                <motion.article {...fadeUp} transition={{ delay: 0.08 }} className="about-page__mv-card">
                  <div className="about-page__mv-icon about-page__mv-icon--vision">
                    <Eye className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-3">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">{about.visionText}</p>
                </motion.article>
              )}
            </div>
          </div>
        </section>
      )}

      {values.length > 0 && (
        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <motion.div {...fadeUp} className="text-center mb-10 sm:mb-12">
              <span className="section-label mb-4 inline-block">What We Stand For</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Core Values</h2>
            </motion.div>
            <div className="about-page__values-grid">
              {values.map(({ title, description }, i) => {
                const Icon = VALUE_ICONS[i % VALUE_ICONS.length]
                const accent = VALUE_ACCENTS[i % VALUE_ACCENTS.length]
                return (
                  <motion.article
                    key={`${title}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="about-page__value-card"
                    style={{ '--value-accent': accent } as React.CSSProperties}
                  >
                    <div className="about-page__value-beam" aria-hidden />
                    <div
                      className="about-page__value-icon"
                      style={{ background: `${accent}14`, color: accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
                    {description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    )}
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <motion.div {...fadeUp} className="text-center mb-10">
              <span className="section-label mb-4 inline-block">Our Journey</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Milestones</h2>
            </motion.div>
            <ol className="about-page__timeline">
              {milestones.map((milestone, i) => (
                <motion.li
                  key={`${milestone.year}-${milestone.title}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="about-page__timeline-item"
                >
                  <span className="about-page__timeline-year">{milestone.year}</span>
                  <div className="about-page__timeline-body">
                    <h3 className="font-display font-semibold">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div {...fadeUp} className="about-page__cta">
            <div className="about-page__cta-glow" aria-hidden />
            <div className="relative z-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Ready to build with {companyName || 'SoftKatta'}?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                From ERP and custom software to websites and mobile apps — let&apos;s discuss your project.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <Link to="/contact" className="glow-btn inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
                  Work With Us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/services" className="hero-cta-ghost inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
                  View Services
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {companyPhone && (
                  <a href={phoneTelHref(companyPhone)} className="inline-flex items-center gap-1.5 hover:text-[var(--brand-blue)] transition-colors">
                    <Phone className="h-4 w-4" /> {companyPhone}
                  </a>
                )}
                {companyWebsite && (
                  <a
                    href={companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[var(--brand-blue)] transition-colors"
                  >
                    <Award className="h-4 w-4" /> {companyWebsite.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
