import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { STATIC_PAGE_SEO } from '@/lib/seo/siteSeo'

const sections = [
  {
    title: 'Information we collect',
    body: 'We may collect information you provide directly (name, email, phone, company name, billing details, support messages, job applications) and technical data (browser type, IP address, cookies) when you use our website, register an account, purchase software, or contact us.',
  },
  {
    title: 'How we use your information',
    body: 'We use collected data to provide and improve our software and services, process orders and subscriptions, send GST invoices and account notifications, respond to support requests, and communicate about products you have shown interest in.',
  },
  {
    title: 'Payment processing',
    body: 'Online payments are processed securely through Razorpay. We do not store full card details on our servers. Payment data is handled according to Razorpay\'s privacy and security standards.',
  },
  {
    title: 'Cookies',
    body: 'Our website uses cookies and similar technologies for authentication, cart functionality, theme preferences, and analytics. You can control cookies through your browser settings.',
  },
  {
    title: 'Data security',
    body: 'We implement role-based access, encryption, secure cloud hosting, and automatic daily backups on paid software plans. No method of transmission over the internet is 100% secure, but we work to protect your data.',
  },
  {
    title: 'Data retention',
    body: 'We retain account and subscription data while your account is active and as required for legal, tax, and billing purposes. You may request data export or deletion by contacting us.',
  },
  {
    title: 'Third-party services',
    body: 'We may use third-party providers for hosting, email delivery, payment processing (Razorpay), maps (Google Maps), and analytics. These providers process data under their own policies.',
  },
  {
    title: 'Your rights',
    body: 'You may request access, correction, or deletion of your personal data, or withdraw marketing consent, by emailing us. We will respond within a reasonable timeframe.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised date.',
  },
]

export default function PrivacyPage() {
  const { supportEmail, companyName } = useSiteBranding()
  const email = supportEmail.trim() || 'support@softkatta.in'
  const seo = STATIC_PAGE_SEO['/privacy']

  usePageSeo(seo ? { ...seo, path: '/privacy' } : null)

  return (
    <div className="legal-page">
      <div className="legal-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Legal
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              How {companyName} collects, uses, and protects your information when you use our website and software products.
            </p>
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
                For privacy-related questions or data requests, email{' '}
                <a href={`mailto:${email}`} className="text-[var(--brand-blue)] font-semibold hover:underline">{email}</a>
                {' '}or visit our{' '}
                <Link to="/contact" className="text-[var(--brand-blue)] font-semibold hover:underline">contact page</Link>.
              </p>
              <Link to="/terms" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
                Read Terms of Service →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
