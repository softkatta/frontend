import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { STATIC_PAGE_SEO } from '@/lib/seo/siteSeo'

const sections = [
  {
    title: 'Acceptance of terms',
    body: 'By accessing softkatta.in, creating an account, or purchasing our software, you agree to these Terms of Service. If you do not agree, please do not use our services.',
  },
  {
    title: 'Services & products',
    body: 'SoftKatta provides SaaS business software (Study Point, Medical Store, Nursery School management) and custom software development services including ERP, websites, and mobile applications. Features and availability may vary by plan.',
  },
  {
    title: 'Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Registration requires accurate information. Profile information must be kept up to date.',
  },
  {
    title: 'Free trial',
    body: 'Products may include a 14-day free trial without requiring payment. At the end of the trial, you must subscribe to a paid plan to continue using the software. Trial terms may change with notice.',
  },
  {
    title: 'Subscriptions & payments',
    body: 'Paid plans are billed monthly or yearly in INR. Payments are processed via Razorpay. GST invoices are generated where applicable. You authorize us to charge your selected payment method for renewals if auto-renew is enabled.',
  },
  {
    title: 'Cancellations & refunds',
    body: 'You may cancel subscriptions from your client dashboard. Refund eligibility depends on the nature of the purchase and timing of the request. Contact support@softkatta.in with your order number for refund inquiries.',
  },
  {
    title: 'Acceptable use',
    body: 'You agree not to misuse our software or website, attempt unauthorized access, interfere with other users, or use the service for unlawful purposes. We may suspend accounts that violate these terms.',
  },
  {
    title: 'Intellectual property',
    body: 'SoftKatta retains ownership of its software, branding, and website content. Subscribers receive a limited license to use the software according to their plan. Custom project ownership terms are defined in separate agreements.',
  },
  {
    title: 'Data & privacy',
    body: 'Your use of our services is also governed by our Privacy Policy. We implement reasonable security measures but cannot guarantee absolute security.',
  },
  {
    title: 'Limitation of liability',
    body: 'To the maximum extent permitted by law, SoftKatta is not liable for indirect, incidental, or consequential damages arising from use of our services. Our total liability is limited to fees paid in the preceding 12 months for the relevant service.',
  },
  {
    title: 'Governing law',
    body: 'These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Maharashtra, India.',
  },
  {
    title: 'Changes',
    body: 'We may update these Terms of Service. Continued use after changes constitutes acceptance of the updated terms.',
  },
]

export default function TermsPage() {
  const { supportEmail, companyName } = useSiteBranding()
  const email = supportEmail.trim() || 'support@softkatta.in'
  const seo = STATIC_PAGE_SEO['/terms']

  usePageSeo(seo ? { ...seo, path: '/terms' } : null)

  return (
    <div className="legal-page">
      <div className="legal-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Legal
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-muted-foreground leading-relaxed">
              Terms governing your use of {companyName} website, accounts, and software subscriptions.
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
              <h2 className="font-display font-bold text-lg mb-2">Questions?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Email{' '}
                <a href={`mailto:${email}`} className="text-[var(--brand-blue)] font-semibold hover:underline">{email}</a>
                {' '}or{' '}
                <Link to="/contact" className="text-[var(--brand-blue)] font-semibold hover:underline">contact our team</Link>.
              </p>
              <Link to="/privacy" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
                Read Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
