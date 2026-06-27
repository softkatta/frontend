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
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { DEFAULT_GST_RATE, normalizeGstRate } from '@/lib/gst'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'

export type SiteBranding = {
  companyName: string
  companyTagline: string
  companyAddress: string
  companyPhone: string
  companyWebsite: string
  supportEmail: string
  gstNumber: string
  gstEnabled: boolean
  logoUrl: string
  faviconUrl: string
  gstRate: number
  loading: boolean
  refresh: () => Promise<void>
}

const defaultBranding: SiteBranding = {
  companyName: BRAND_NAME,
  companyTagline: '',
  companyAddress: '',
  companyPhone: '',
  companyWebsite: '',
  supportEmail: '',
  gstNumber: '',
  gstEnabled: false,
  logoUrl: BRAND_LOGO_SRC,
  faviconUrl: '',
  gstRate: DEFAULT_GST_RATE,
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

function applyDocumentTitle(companyName: string) {
  if (companyName) {
    document.title = companyName
  }
}

async function fetchBranding(): Promise<Omit<SiteBranding, 'loading' | 'refresh'>> {
  const data = await siteContentApi.branding()
  const logoUrl = data.company_logo_url ? resolveMediaUrl(data.company_logo_url) : BRAND_LOGO_SRC
  const faviconUrl = data.favicon_url ? resolveMediaUrl(data.favicon_url) : ''
  const companyName = data.company_name || BRAND_NAME

  applyFavicon(faviconUrl)
  applyDocumentTitle(companyName)

  return {
    companyName,
    companyTagline: data.company_tagline || '',
    companyAddress: data.company_address || '',
    companyPhone: data.company_phone || '',
    companyWebsite: data.company_website || '',
    supportEmail: data.support_email || '',
    gstNumber: (data.gst_number || '').trim(),
    gstEnabled: Boolean((data.gst_number || '').trim()) && Boolean(data.gst_enabled ?? true),
    logoUrl,
    faviconUrl,
    gstRate: normalizeGstRate(data.gst_rate),
  }
}

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Omit<SiteBranding, 'refresh'>>({
    companyName: BRAND_NAME,
    companyTagline: '',
    companyAddress: '',
    companyPhone: '',
    companyWebsite: '',
    supportEmail: '',
    gstNumber: '',
    gstEnabled: false,
    logoUrl: BRAND_LOGO_SRC,
    faviconUrl: '',
    gstRate: DEFAULT_GST_RATE,
    loading: true,
  })

  const refresh = useCallback(async () => {
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
