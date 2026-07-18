import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'

export type LegalSection = { title: string; body: string }

type LegalPageProps = {
  icon: LucideIcon
  title: string
  intro: string
  sections: LegalSection[]
  contactBlurb: string
  relatedLinks?: Array<{ label: string; to: string }>
}

export function LegalPage({
  icon: Icon,
  title,
  intro,
  sections,
  contactBlurb,
  relatedLinks = [],
}: LegalPageProps) {
  const { supportEmail } = useSiteBranding()
  const email = supportEmail.trim() || 'support@softkatta.in'

  return (
    <div className="legal-page">
      <div className="legal-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" /> Legal
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">{intro}</p>
            <p className="text-xs text-muted-foreground mt-4">Last updated: July 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="legal-page__content space-y-8">
            {sections.map((section, i) => (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="legal-page__section"
              >
                <h2 className="font-display font-bold text-lg mb-2">{section.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
              </motion.article>
            ))}

            <div className="legal-page__contact premium-card p-6 rounded-2xl">
              <h2 className="font-display font-bold text-lg mb-2">Contact us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {contactBlurb}{' '}
                <a href={`mailto:${email}`} className="text-[var(--brand-blue)] font-semibold hover:underline">{email}</a>
                {' '}or visit our{' '}
                <Link to="/contact" className="text-[var(--brand-blue)] font-semibold hover:underline">contact page</Link>.
              </p>
              {relatedLinks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
