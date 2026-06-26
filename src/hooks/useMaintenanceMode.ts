import { useCallback, useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api/modules/siteContent.api'
import { asBool, asRecord, asString } from '@/lib/apiHelpers'
import type { MaintenancePageContent, MaintenancePageType } from '@/types/maintenance'
import { EMPTY_MAINTENANCE_CONTENT } from '@/types/maintenance'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'

type MaintenanceState = MaintenancePageContent & {
  loading: boolean
}

function parsePageType(value: unknown): MaintenancePageType {
  return String(value).toLowerCase() === 'maintenance' ? 'maintenance' : 'launch'
}

function parseMaintenance(payload: unknown): MaintenancePageContent {
  const data = asRecord(payload)
  const pageType = parsePageType(data.page_type ?? data.pageType)

  return {
    enabled: asBool(data.enabled),
    pageType,
    badge: asString(data.badge),
    message: asString(data.message),
    imageUrl: pageType === 'maintenance' ? asString(data.image_url ?? data.imageUrl) || undefined : undefined,
    logoUrl: asString(data.logo_url ?? data.logoUrl) || undefined,
    companyName: asString(data.company_name ?? data.companyName, 'SoftKatta Solutions'),
    companyTagline: asString(data.company_tagline ?? data.companyTagline),
  }
}

export function useMaintenanceMode(): MaintenanceState {
  const [state, setState] = useState<MaintenanceState>({
    ...EMPTY_MAINTENANCE_CONTENT,
    loading: true,
  })

  const load = useCallback(() => {
    siteContentApi
      .maintenance()
      .then((data) => {
        const parsed = parseMaintenance(data)
        setState({
          ...parsed,
          imageUrl: parsed.imageUrl ? resolveMediaUrl(parsed.imageUrl) : undefined,
          logoUrl: parsed.logoUrl ? resolveMediaUrl(parsed.logoUrl) : undefined,
          loading: false,
        })
      })
      .catch(() => {
        setState({ ...EMPTY_MAINTENANCE_CONTENT, loading: false })
      })
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 15000)

    const unsubscribe = onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'maintenance') || shouldRefreshScope(scope, 'branding')) {
        load()
      }
    })

    return () => {
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [load])

  return state
}
