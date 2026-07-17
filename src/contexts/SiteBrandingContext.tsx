import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { siteContentApi } from '@/services/api'
import { BRAND_LOGO_SRC, BRAND_NAME, BRAND_TAGLINE, BRAND_DESCRIPTION, BRAND_SHORT_NAME, BRAND_ADDRESS, BRAND_PHONE, BRAND_WEBSITE } from '@/lib/brand'
import { DEFAULT_GST_RATE, normalizeGstRate } from '@/lib/gst'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'

type BrandingData = Omit<SiteBranding, 'loading' | 'refresh'>

let brandingCache: BrandingData | null = null
let brandingInflight: Promise<BrandingData> | null = null

export type SiteBranding = {
  companyName: string
  companyTagline: string
  companyDescription: string
  brandShortName: string
  companyAddress: string
  companyPhone: string
  companyWebsite: string
  supportEmail: string
  gstNumber: string
  gstEnabled: boolean
  logoUrl: string
  faviconUrl: string
  gstRate: number
  socialFacebook: string
  socialInstagram: string
  socialLinkedin: string
  socialTwitter: string
  socialYoutube: string
  socialWhatsapp: string
  loading: boolean
  refresh: () => Promise<void>
}

const defaultBranding: SiteBranding = {
  companyName: BRAND_NAME,
  companyTagline: BRAND_TAGLINE,
  companyDescription: BRAND_DESCRIPTION,
  brandShortName: BRAND_SHORT_NAME,
  companyAddress: BRAND_ADDRESS,
  companyPhone: BRAND_PHONE,
  companyWebsite: BRAND_WEBSITE,
  supportEmail: '',
  gstNumber: '',
  gstEnabled: false,
  logoUrl: BRAND_LOGO_SRC,
  faviconUrl: '',
  gstRate: DEFAULT_GST_RATE,
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedin: '',
  socialTwitter: '',
  socialYoutube: '',
  socialWhatsapp: '',
  loading: true,
  refresh: async () => {},
}

const SiteBrandingContext = createContext<SiteBranding>(defaultBranding)

function applyFavicon(faviconUrl: string) {
  if (!faviconUrl) return

  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = faviconUrl
}

async function fetchBranding(): Promise<BrandingData> {
  if (brandingCache) return brandingCache
  if (brandingInflight) return brandingInflight

  brandingInflight = siteContentApi.branding()
    .then((data) => {
      const logoUrl = data.company_logo_url ? resolveMediaUrl(data.company_logo_url) : BRAND_LOGO_SRC
      const faviconUrl = data.favicon_url ? resolveMediaUrl(data.favicon_url) : ''
      const companyName = data.company_name || BRAND_NAME

      applyFavicon(faviconUrl)

      brandingCache = {
        companyName,
        companyTagline: data.company_tagline || BRAND_TAGLINE,
        companyDescription: data.company_description || BRAND_DESCRIPTION,
        brandShortName: data.brand_short_name || BRAND_SHORT_NAME,
        companyAddress: data.company_address || BRAND_ADDRESS,
        companyPhone: data.company_phone || BRAND_PHONE,
        companyWebsite: data.company_website || BRAND_WEBSITE,
        supportEmail: data.support_email || '',
        gstNumber: (data.gst_number || '').trim(),
        gstEnabled: Boolean((data.gst_number || '').trim()) && Boolean(data.gst_enabled ?? true),
        logoUrl,
        faviconUrl,
        gstRate: normalizeGstRate(data.gst_rate),
        socialFacebook: (data.social_facebook || '').trim(),
        socialInstagram: (data.social_instagram || '').trim(),
        socialLinkedin: (data.social_linkedin || '').trim(),
        socialTwitter: (data.social_twitter || '').trim(),
        socialYoutube: (data.social_youtube || '').trim(),
        socialWhatsapp: (data.social_whatsapp || '').trim(),
      }
      return brandingCache
    })
    .finally(() => {
      brandingInflight = null
    })

  return brandingInflight
}

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Omit<SiteBranding, 'refresh'>>({
    companyName: brandingCache?.companyName ?? BRAND_NAME,
    companyTagline: brandingCache?.companyTagline ?? BRAND_TAGLINE,
    companyDescription: brandingCache?.companyDescription ?? BRAND_DESCRIPTION,
    brandShortName: brandingCache?.brandShortName ?? BRAND_SHORT_NAME,
    companyAddress: brandingCache?.companyAddress ?? BRAND_ADDRESS,
    companyPhone: brandingCache?.companyPhone ?? BRAND_PHONE,
    companyWebsite: brandingCache?.companyWebsite ?? BRAND_WEBSITE,
    supportEmail: brandingCache?.supportEmail ?? '',
    gstNumber: brandingCache?.gstNumber ?? '',
    gstEnabled: brandingCache?.gstEnabled ?? false,
    logoUrl: brandingCache?.logoUrl ?? BRAND_LOGO_SRC,
    faviconUrl: brandingCache?.faviconUrl ?? '',
    gstRate: brandingCache?.gstRate ?? DEFAULT_GST_RATE,
    socialFacebook: brandingCache?.socialFacebook ?? '',
    socialInstagram: brandingCache?.socialInstagram ?? '',
    socialLinkedin: brandingCache?.socialLinkedin ?? '',
    socialTwitter: brandingCache?.socialTwitter ?? '',
    socialYoutube: brandingCache?.socialYoutube ?? '',
    socialWhatsapp: brandingCache?.socialWhatsapp ?? '',
    loading: !brandingCache,
  })

  const refresh = useCallback(async () => {
    brandingCache = null
    try {
      const next = await fetchBranding()
      setBranding({ ...next, loading: false })
    } catch {
      setBranding((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'branding')) {
        void refresh()
      }
    })
  }, [refresh])

  const value = useMemo<SiteBranding>(
    () => ({ ...branding, refresh }),
    [branding, refresh],
  )

  return <SiteBrandingContext.Provider value={value}>{children}</SiteBrandingContext.Provider>
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext)
}
