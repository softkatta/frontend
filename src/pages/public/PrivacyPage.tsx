import { ShieldCheck } from 'lucide-react'
import { LegalPage } from '@/components/common/LegalPage'
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
  const { companyName } = useSiteBranding()
  const seo = STATIC_PAGE_SEO['/privacy']

  usePageSeo(seo ? { ...seo, path: '/privacy' } : null)

  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy Policy"
      intro={`How ${companyName} collects, uses, and protects your information when you use our website and software products.`}
      sections={sections}
      contactBlurb="For privacy-related questions or data requests, email"
      relatedLinks={[
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Refund Policy', to: '/refund-policy' },
        { label: 'Shipping Policy', to: '/shipping-policy' },
      ]}
    />
  )
}
