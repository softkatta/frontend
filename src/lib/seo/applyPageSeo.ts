import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { getSiteUrl } from '@/config/env'
import { buildOrganizationJsonLd, buildPageTitle, SITE_SEO_DEFAULTS, type PageSeoConfig } from '@/lib/seo/siteSeo'

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  if (!href) return
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove()
}

function injectJsonLd(id: string, data: Record<string, unknown> | Array<Record<string, unknown>>) {
  removeJsonLd(id)
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export type ApplyPageSeoOptions = PageSeoConfig & {
  siteName?: string
  image?: string
}

export function applyPageSeo(options: ApplyPageSeoOptions = {}) {
  const siteName = options.siteName || SITE_SEO_DEFAULTS.siteName
  const siteUrl = getSiteUrl()
  const path = options.path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  const canonical = `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`

  const title = buildPageTitle(options.title, siteName)
  const description = options.description || SITE_SEO_DEFAULTS.description
  const keywords = options.keywords || SITE_SEO_DEFAULTS.keywords
  const image = options.image || `${siteUrl}${BRAND_LOGO_SRC.startsWith('/') ? BRAND_LOGO_SRC : `/${BRAND_LOGO_SRC}`}`
  const ogType = options.ogType || 'website'

  const ogTitle = options.ogTitle || title
  const ogDescription = options.ogDescription || description
  const twitterTitle = options.twitterTitle || ogTitle
  const twitterDescription = options.twitterDescription || ogDescription

  document.title = title

  upsertMeta('description', description)
  upsertMeta('keywords', keywords)
  upsertMeta('author', siteName)
  upsertMeta('robots', options.noindex ? 'noindex, nofollow' : SITE_SEO_DEFAULTS.robots)

  upsertMeta('og:title', ogTitle, 'property')
  upsertMeta('og:description', ogDescription, 'property')
  upsertMeta('og:type', ogType, 'property')
  upsertMeta('og:url', canonical, 'property')
  upsertMeta('og:site_name', siteName, 'property')
  upsertMeta('og:locale', SITE_SEO_DEFAULTS.locale, 'property')
  upsertMeta('og:image', image, 'property')

  upsertMeta('twitter:card', SITE_SEO_DEFAULTS.twitterCard)
  upsertMeta('twitter:title', twitterTitle)
  upsertMeta('twitter:description', twitterDescription)
  upsertMeta('twitter:image', image)

  upsertLink('canonical', canonical)

  if (options.jsonLd) {
    injectJsonLd('page-jsonld', options.jsonLd)
  } else {
    removeJsonLd('page-jsonld')
  }
}

export function applyOrganizationJsonLd(
  siteName = BRAND_NAME,
  siteUrl = getSiteUrl(),
  details: {
    description?: string
    logo?: string
    address?: string
    phone?: string
    email?: string
  } = {},
) {
  const logo = details.logo || `${siteUrl}${BRAND_LOGO_SRC.startsWith('/') ? BRAND_LOGO_SRC : `/${BRAND_LOGO_SRC}`}`
  injectJsonLd('org-jsonld', buildOrganizationJsonLd({
    name: siteName,
    url: siteUrl,
    description: details.description,
    logo,
    address: details.address,
    phone: details.phone,
    email: details.email,
  }))
}
