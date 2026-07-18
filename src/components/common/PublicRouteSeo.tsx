import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { applyPageSeo } from '@/lib/seo/applyPageSeo'
import { buildOrganizationJsonLd, resolveStaticPageSeo } from '@/lib/seo/siteSeo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'

/** Applies route-based SEO for public pages without per-page hooks */
export function PublicRouteSeo() {
  const { pathname } = useLocation()
  const { companyName, companyAddress, companyPhone, companyDescription, supportEmail, logoUrl } = useSiteBranding()
  const { seoFor } = usePublicPageContent()

  const staticSeo = useMemo(() => resolveStaticPageSeo(pathname), [pathname])
  const dbSeo = seoFor(pathname)

  useEffect(() => {
    if (!staticSeo && !dbSeo.title && !dbSeo.description) return

    const address = companyAddress.trim()
    const description = (dbSeo.description || staticSeo?.description)?.replace(/SoftKatta Solutions/g, companyName) || companyDescription

    applyPageSeo({
      ...(staticSeo ?? {}),
      ...dbSeo,
      path: pathname,
      siteName: companyName,
      title: (dbSeo.title || staticSeo?.title)?.replace('SoftKatta Solutions', companyName),
      description,
      jsonLd: pathname === '/'
        ? buildOrganizationJsonLd({
            name: companyName,
            address,
            phone: companyPhone.trim() || undefined,
            email: supportEmail.trim() || undefined,
            logo: logoUrl || undefined,
            description,
          })
        : staticSeo?.jsonLd,
    })
  }, [staticSeo, dbSeo, pathname, companyName, companyAddress, companyPhone, companyDescription, supportEmail, logoUrl])

  return null
}
