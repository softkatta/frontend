import { RotateCcw } from 'lucide-react'
import { LegalPage } from '@/components/common/LegalPage'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { STATIC_PAGE_SEO } from '@/lib/seo/siteSeo'

const sections = [
  {
    title: 'Overview',
    body: 'This Refund Policy explains when SoftKatta Solutions may issue refunds for software subscriptions, add-ons, and custom development services purchased through softkatta.in. By completing a purchase, you agree to this policy along with our Terms & Conditions.',
  },
  {
    title: 'Digital software subscriptions',
    body: 'SaaS products (including Study Point, Medical Store, Nursery School, and Hospital management software) are digital services. Once a paid subscription is activated and access is granted, fees are generally non-refundable for the remaining billing period, except where required by applicable Indian consumer law or as stated below.',
  },
  {
    title: 'Free trial',
    body: 'Where a free trial is offered, you can evaluate the product before paying. Cancel before the trial ends to avoid charges. Trial periods are not refundable cash equivalents.',
  },
  {
    title: 'Eligible refund cases',
    body: 'We may consider a refund or credit if: (1) you were charged in error (duplicate payment), (2) you could not access the product due to a verified platform issue on our side within 7 days of purchase and we could not resolve it, or (3) a payment was taken after a confirmed cancellation that should have stopped renewal.',
  },
  {
    title: 'Non-refundable items',
    body: 'Refunds are not available for: change of mind after access is provided, unused time in an active billing cycle after voluntary cancellation, third-party fees (payment gateway charges where already settled), or custom work already delivered or started as agreed.',
  },
  {
    title: 'Custom software & development projects',
    body: 'Custom ERP, website, mobile app, and consulting projects follow the payment schedule in your proposal or agreement. Advance or milestone payments for work already performed are non-refundable. Unused prepaid balances for work not yet started may be discussed case by case.',
  },
  {
    title: 'How to request a refund',
    body: 'Email support with your registered name, order or invoice number, payment date, and reason within 7 days of the charge (or sooner if your invoice states a different window). We aim to respond within 3–5 business days. Approved refunds are processed to the original payment method via Razorpay and may take 5–10 business days to appear, depending on your bank.',
  },
  {
    title: 'Cancellations',
    body: 'You may cancel auto-renewal from your client dashboard to stop future charges. Cancellation stops the next renewal; it does not automatically refund the current paid period unless you qualify under this policy.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this Refund Policy from time to time. The version posted on this page applies to purchases made after the update date.',
  },
]

export default function RefundPolicyPage() {
  const { companyName } = useSiteBranding()
  const seo = STATIC_PAGE_SEO['/refund-policy']

  usePageSeo(seo ? { ...seo, path: '/refund-policy' } : null)

  return (
    <LegalPage
      icon={RotateCcw}
      title="Refund Policy"
      intro={`Refund and cancellation rules for ${companyName} software subscriptions and custom development purchases.`}
      sections={sections}
      contactBlurb="For refund requests, include your order or invoice number and email"
      relatedLinks={[
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Shipping Policy', to: '/shipping-policy' },
        { label: 'Privacy Policy', to: '/privacy' },
      ]}
    />
  )
}
