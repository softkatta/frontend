import { Truck } from 'lucide-react'
import { LegalPage } from '@/components/common/LegalPage'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { STATIC_PAGE_SEO } from '@/lib/seo/siteSeo'

const sections = [
  {
    title: 'Digital delivery (no physical shipping)',
    body: 'SoftKatta Solutions primarily sells software subscriptions, SaaS licenses, and digital services. These products are delivered electronically — there is no physical parcel, courier, or postal shipment for standard online purchases.',
  },
  {
    title: 'How you receive access',
    body: 'After successful payment on softkatta.in, account access and product activation are usually provided instantly or within a short processing window. Login credentials, license details, or portal access are sent to your registered email and/or shown in your client dashboard.',
  },
  {
    title: 'Delivery timeline',
    body: 'Typical digital delivery: within minutes to a few hours after payment confirmation. During high traffic, gateway delays, or manual verification, delivery may take up to 24–48 business hours. If you do not receive access within this window, contact support with your order number.',
  },
  {
    title: 'Custom projects & on-site work',
    body: 'Custom software, ERP implementation, training, or on-site visits (if contracted) are delivered as per the project timeline in your proposal. Deliverables are shared digitally (secure links, repositories, or demos) unless the agreement specifies otherwise. Travel or hardware supply, if any, is listed separately in the contract.',
  },
  {
    title: 'Shipping charges',
    body: 'There are no shipping or courier charges for digital products. Any optional hardware, printed materials, or logistics arranged under a custom agreement will show separately on the quotation or invoice before you pay.',
  },
  {
    title: 'Service area',
    body: 'Our software is available online across India (and internationally where permitted). Support and implementation services are focused on Nanded, Maharashtra, and pan-India remote delivery.',
  },
  {
    title: 'Failed or delayed delivery',
    body: 'If payment succeeds but access is not granted due to a verified issue on our side, we will restore access promptly or process a refund as described in our Refund Policy.',
  },
  {
    title: 'Contact for delivery issues',
    body: 'For missing activation emails, login problems after purchase, or project delivery queries, contact support with your registered email and order or invoice number.',
  },
]

export default function ShippingPolicyPage() {
  const { companyName } = useSiteBranding()
  const seo = STATIC_PAGE_SEO['/shipping-policy']

  usePageSeo(seo ? { ...seo, path: '/shipping-policy' } : null)

  return (
    <LegalPage
      icon={Truck}
      title="Shipping Policy"
      intro={`${companyName} delivers software and digital services electronically. This page explains delivery timelines and what “shipping” means for our products.`}
      sections={sections}
      contactBlurb="For delivery or access issues after purchase, email"
      relatedLinks={[
        { label: 'Refund Policy', to: '/refund-policy' },
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Privacy Policy', to: '/privacy' },
      ]}
    />
  )
}
