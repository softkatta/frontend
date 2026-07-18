export type PortfolioCategory =
  | 'all'
  | 'saas'
  | 'education'
  | 'healthcare'
  | 'retail'
  | 'custom'

export type PortfolioItem = {
  id: string
  title: string
  summary: string
  category: Exclude<PortfolioCategory, 'all'>
  industry: string
  tags: string[]
  href?: string
  cta?: string
  accent: string
}

/** Showcase of SoftKatta products and custom delivery work */
export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'study-point',
    title: 'Study Point Management Software',
    summary:
      'End-to-end coaching institute ERP — admissions, fees, attendance, batches, exams, and WhatsApp notifications for institutes across Maharashtra.',
    category: 'education',
    industry: 'Education / Coaching',
    tags: ['SaaS', 'ERP', 'WhatsApp'],
    href: '/products/study-point-management-software',
    cta: 'View product',
    accent: '#2563eb',
  },
  {
    id: 'medical-store',
    title: 'Medical Store Management Software',
    summary:
      'Inventory, billing, GST invoices, expiry alerts, and supplier tracking built for medical stores and pharmacies.',
    category: 'retail',
    industry: 'Pharmacy / Retail',
    tags: ['SaaS', 'Billing', 'GST'],
    href: '/products/medical-store-management-software',
    cta: 'View product',
    accent: '#0d9488',
  },
  {
    id: 'nursery-school',
    title: 'Nursery School Management Software',
    summary:
      'Parent communication, fees, attendance, and daily operations for nursery and preschool institutions.',
    category: 'education',
    industry: 'Education / Preschool',
    tags: ['SaaS', 'Parents', 'Fees'],
    href: '/products/nursery-school-management-software',
    cta: 'View product',
    accent: '#0891b2',
  },
  {
    id: 'hospital',
    title: 'Hospital Management Software',
    summary:
      'OPD/IPD workflows, patient records, pharmacy, billing, and reporting for clinics and hospitals.',
    category: 'healthcare',
    industry: 'Healthcare',
    tags: ['HMS', 'OPD', 'Billing'],
    href: '/products',
    cta: 'Explore products',
    accent: '#1e40af',
  },
  {
    id: 'custom-erp',
    title: 'Custom Business ERP',
    summary:
      'Tailored ERP modules for inventory, accounts, HR, and operations — designed around each client’s real processes.',
    category: 'custom',
    industry: 'Enterprise / SME',
    tags: ['Custom', 'Laravel', 'React'],
    href: '/services',
    cta: 'Our services',
    accent: '#0f766e',
  },
  {
    id: 'web-apps',
    title: 'Business Websites & Web Apps',
    summary:
      'Marketing sites, dashboards, and customer portals with secure hosting, SEO foundations, and mobile-first UX.',
    category: 'custom',
    industry: 'Web / Digital',
    tags: ['Website', 'SEO', 'Responsive'],
    href: '/services',
    cta: 'Our services',
    accent: '#1d4ed8',
  },
  {
    id: 'mobile',
    title: 'Mobile App Development',
    summary:
      'Android and cross-platform apps for field teams, customers, and institute parents — integrated with SoftKatta backends.',
    category: 'custom',
    industry: 'Mobile',
    tags: ['Android', 'API', 'Cloud'],
    href: '/contact',
    cta: 'Start a project',
    accent: '#0e7490',
  },
  {
    id: 'saas-platform',
    title: 'Multi-tenant SaaS Platform',
    summary:
      'Subscription billing, GST invoices, client portals, and role-based access powering SoftKatta’s own product suite.',
    category: 'saas',
    industry: 'SaaS Platform',
    tags: ['Multi-tenant', 'Payments', 'Portal'],
    href: '/products',
    cta: 'Browse shop',
    accent: '#0369a1',
  },
]

export const PORTFOLIO_FILTERS: { key: PortfolioCategory; label: string }[] = [
  { key: 'all', label: 'All work' },
  { key: 'saas', label: 'SaaS' },
  { key: 'education', label: 'Education' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'retail', label: 'Retail' },
  { key: 'custom', label: 'Custom' },
]
