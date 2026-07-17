import { useCallback, useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api/modules/siteContent.api'
import { asBool, asRecord, asString } from '@/lib/apiHelpers'
import { readSessionCache, writeSessionCache } from '@/lib/publicDataCache'
import type { MaintenancePageContent, MaintenancePageType } from '@/types/maintenance'
import { EMPTY_MAINTENANCE_CONTENT } from '@/types/maintenance'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'

const MAINTENANCE_CACHE_KEY = 'sk_maintenance'
const MAINTENANCE_CACHE_TTL_MS = 60_000
const MAINTENANCE_POLL_MS = 60_000

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

function hydrateMaintenance(parsed: MaintenancePageContent): MaintenancePageContent {
  return {
    ...parsed,
    imageUrl: parsed.imageUrl ? resolveMediaUrl(parsed.imageUrl) : undefined,
    logoUrl: parsed.logoUrl ? resolveMediaUrl(parsed.logoUrl) : undefined,
  }
}

function readCachedMaintenance(): MaintenancePageContent | null {
  const cached = readSessionCache<MaintenancePageContent>(MAINTENANCE_CACHE_KEY, MAINTENANCE_CACHE_TTL_MS)
  return cached ? hydrateMaintenance(cached) : null
}

export function useMaintenanceMode(): MaintenanceState {
  const cached = readCachedMaintenance()
  const [state, setState] = useState<MaintenanceState>({
    ...(cached ?? EMPTY_MAINTENANCE_CONTENT),
    loading: !cached,
  })

  const load = useCallback(() => {
    siteContentApi
      .maintenance()
      .then((data) => {
        const parsed = hydrateMaintenance(parseMaintenance(data))
        writeSessionCache(MAINTENANCE_CACHE_KEY, parsed)
        setState({ ...parsed, loading: false })
      })
      .catch(() => {
        setState((prev) => ({ ...(prev.loading ? EMPTY_MAINTENANCE_CONTENT : prev), loading: false }))
      })
  }, [])

  useEffect(() => {
    load()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }, MAINTENANCE_POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    const unsubscribe = onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'maintenance') || shouldRefreshScope(scope, 'branding')) {
        load()
      }
    })

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      unsubscribe()
    }
  }, [load])

  return state
}
