import { BRAND_ADDRESS, BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE, BRAND_WEBSITE } from '@/lib/brand'

export type PageSeoConfig = {
  title?: string
  description?: string
  keywords?: string
  path?: string
  ogType?: 'website' | 'article' | 'product'
  ogTitle?: string
  ogDescription?: string
  twitterTitle?: string
  twitterDescription?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export const DEFAULT_KEYWORDS = [
  'SoftKatta Solutions',
  'Software Company Nanded',
  'Software Company Talni',
  'IT Company Maharashtra',
  'Custom Software Development',
  'ERP Software',
  'Business Management Software',
  'Hospital Management Software',
  'Study Point Management Software',
  'Medical Store Management Software',
  'Nursery School Management Software',
  'Website Development',
  'Laravel Development',
  'React Development',
  'API Development',
  'Cloud Software',
  'School ERP',
  'Medical ERP',
  'Hospital ERP',
  'Software Services India',
  'Software Company India',
  'Software Developer Nanded',
  'Website Developer Nanded',
  'ERP Company Maharashtra',
].join(', ')

export const HOME_META_DESCRIPTION =
  'SoftKatta Solutions is a software development company based in Talni, Nanded, Maharashtra. We develop custom software, ERP solutions, web applications, mobile apps, and business management systems including Study Point Management, Medical Store Management, Nursery School Management, and Hospital Management Software. We also provide website development, cloud solutions, API integration, software maintenance, and IT consulting services.'

export const SITE_SEO_DEFAULTS = {
  siteName: BRAND_NAME,
  tagline: BRAND_TAGLINE,
  description: BRAND_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  locale: 'en_IN',
  twitterCard: 'summary_large_image' as const,
  canonicalUrl: `${BRAND_WEBSITE}/`,
  robots: 'index, follow, max-image-preview:large',
  ogTitle: 'SoftKatta Solutions | Custom Software Development & ERP Solutions',
  ogDescription:
    'SoftKatta Solutions develops ERP software, websites, mobile applications, and custom business software for education, healthcare, retail, and enterprises.',
  twitterTitle: 'SoftKatta Solutions | Software Development Company',
  twitterDescription:
    'Professional software development company offering ERP software, websites, mobile apps, and custom software solutions across India.',
}

/** Recommended image alt text for marketing assets */
export const SEO_IMAGE_ALT = {
  office: 'SoftKatta Solutions Office',
  customSoftware: 'Custom Software Development',
  erpDashboard: 'ERP Software Dashboard',
  hospitalSoftware: 'Hospital Management Software',
  studyPoint: 'Study Point Management Software',
  medicalStore: 'Medical Store Software',
  nurserySchool: 'Nursery School Management Software',
  websiteDev: 'Website Development Services',
  itCompanyNanded: 'IT Company Nanded',
  devTeam: 'Software Development Team',
} as const

/** Static public routes — on-page SEO for SoftKatta Solutions */
export const STATIC_PAGE_SEO: Record<string, PageSeoConfig> = {
  '/': {
    title: `${BRAND_NAME} | Custom Software Development Company in Nanded | ERP & Business Management Software`,
    description: HOME_META_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    ogTitle: SITE_SEO_DEFAULTS.ogTitle,
    ogDescription: SITE_SEO_DEFAULTS.ogDescription,
    twitterTitle: SITE_SEO_DEFAULTS.twitterTitle,
    twitterDescription: SITE_SEO_DEFAULTS.twitterDescription,
    ogType: 'website',
  },
  '/products': {
    title: `Business Software Products — ERP & Management Software | ${BRAND_NAME}`,
    description:
      'Study Point Management Software, Medical Store Management Software, Nursery School Management Software, and Hospital Management Software. Automate operations and simplify day-to-day business management.',
    keywords: `${DEFAULT_KEYWORDS}, Study Point software, medical store ERP, nursery school ERP, hospital ERP Nanded`,
  },
  '/pricing': {
    title: `Software Pricing — ${BRAND_NAME}`,
    description:
      'Affordable pricing for SoftKatta Solutions ERP and business management software. Custom software development and SaaS plans for schools, medical stores, coaching institutes, and enterprises in Nanded and across India.',
    keywords: `${DEFAULT_KEYWORDS}, software pricing India, ERP pricing Maharashtra`,
  },
  '/services': {
    title: `Software Development Services That Help Your Business Grow | ${BRAND_NAME}`,
    description:
      'Innovative custom software, ERP, website, mobile app, SaaS, cloud, API integration, UI/UX design, and maintenance services for businesses across India.',
    keywords: `${DEFAULT_KEYWORDS}, IT consulting Nanded, software maintenance, payment gateway integration`,
  },
  '/about': {
    title: `About ${BRAND_NAME} — Building Smart Software Solutions in Nanded`,
    description:
      'SoftKatta Solutions is a software development company in Talni, Nanded, Maharashtra. We build ERP software, custom applications, websites, and mobile apps for education, healthcare, retail, and enterprises.',
    keywords: `${DEFAULT_KEYWORDS}, about SoftKatta, software company Talni Nanded`,
  },
  '/contact': {
    title: `Contact ${BRAND_NAME} — Let's Build Something Great Together`,
    description:
      'Contact SoftKatta Solutions for custom software, ERP solutions, website development, and mobile applications. Request a consultation — we respond within 24 hours.',
    keywords: `${DEFAULT_KEYWORDS}, contact SoftKatta Nanded, software demo Talni`,
  },
  '/blog': {
    title: `Technology Insights, Software Tips & Business Automation | ${BRAND_NAME}`,
    description:
      'Software trends, ERP guides, cloud computing, AI, web and mobile development, healthcare and education technology articles from SoftKatta Solutions.',
    keywords: `${DEFAULT_KEYWORDS}, software development blog India, ERP blog, business automation`,
  },
  '/careers': {
    title: `Careers — Join ${BRAND_NAME} | Software Jobs in Nanded`,
    description:
      'Join SoftKatta Solutions and build innovative software that makes a difference. Open roles for developers, designers, testers, and technology enthusiasts in Nanded, Maharashtra.',
    keywords: `${DEFAULT_KEYWORDS}, software jobs Nanded, developer jobs Maharashtra`,
  },
  '/faq': {
    title: `FAQ — Software Development & ERP Questions | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about SoftKatta Solutions services, custom software development, ERP products, support, and industries we serve across India.',
    keywords: `${DEFAULT_KEYWORDS}, software FAQ, ERP questions Nanded`,
  },
  '/privacy': {
    title: `Privacy Policy | ${BRAND_NAME}`,
    description:
      'Learn how SoftKatta Solutions collects, uses, and protects your personal information when you use our website and business software products.',
    keywords: `${DEFAULT_KEYWORDS}, privacy policy, data protection`,
  },
  '/terms': {
    title: `Terms of Service | ${BRAND_NAME}`,
    description:
      'Terms of Service for SoftKatta Solutions software subscriptions, accounts, free trials, payments, and custom development services.',
    keywords: `${DEFAULT_KEYWORDS}, terms of service, software license`,
  },
  '/cart': {
    title: `Cart — ${BRAND_NAME}`,
    description: 'Review your SoftKatta Solutions software cart before secure checkout.',
    noindex: true,
  },
  '/checkout': {
    title: `Checkout — ${BRAND_NAME}`,
    description: 'Complete your SoftKatta Solutions software purchase securely.',
    noindex: true,
  },
  '/register': {
    title: `Create Account — ${BRAND_NAME}`,
    description: 'Create your SoftKatta Solutions account and access cloud business software and ERP solutions.',
  },
  '/login': {
    title: `Login — ${BRAND_NAME}`,
    description: 'Sign in to your SoftKatta Solutions account — dashboard, subscriptions, and invoices.',
    noindex: true,
  },
}

export function resolveStaticPageSeo(pathname: string): PageSeoConfig | null {
  return STATIC_PAGE_SEO[pathname] ?? null
}

export function buildPageTitle(pageTitle?: string, siteName = BRAND_NAME): string {
  if (!pageTitle) return `${siteName} | ${BRAND_TAGLINE}`
  if (pageTitle.includes(siteName)) return pageTitle
  return `${pageTitle} | ${siteName}`
}

export function buildOrganizationJsonLd(options: {
  name?: string
  url?: string
  description?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
} = {}) {
  const name = options.name || BRAND_NAME
  const url = options.url || BRAND_WEBSITE
  const description = options.description || BRAND_DESCRIPTION
  const address = options.address || BRAND_ADDRESS

  return [
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'ProfessionalService'],
      name,
      url,
      logo: options.logo,
      description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
        addressLocality: 'Talni',
        addressRegion: 'Maharashtra',
        postalCode: '431602',
        addressCountry: 'IN',
      },
      ...(options.phone ? { telephone: options.phone } : {}),
      ...(options.email ? { email: options.email } : {}),
      areaServed: [
        { '@type': 'City', name: 'Nanded' },
        { '@type': 'State', name: 'Maharashtra' },
        { '@type': 'Country', name: 'India' },
      ],
      knowsAbout: [
        'Custom Software Development',
        'ERP Software Development',
        'Hospital Management Software',
        'Medical Store Management Software',
        'Study Point Management Software',
        'Nursery School Management Software',
        'Website Development',
        'Mobile App Development',
        'API Integration',
        'Cloud Software',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${url.replace(/\/$/, '')}/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}
