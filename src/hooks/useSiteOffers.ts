import { useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'
import type { SiteOffer } from '@/types/offers'

let cache: SiteOffer[] | null = null
let inflight: Promise<SiteOffer[]> | null = null

export function clearSiteOffersCache() {
  cache = null
  inflight = null
}

async function fetchOffers(): Promise<SiteOffer[]> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = siteContentApi.offers()
    .then((res) => {
      const items = unwrapList<SiteOffer>(res)
      cache = items
      return items
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function useSiteOffers() {
  const [offers, setOffers] = useState<SiteOffer[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let cancelled = false
    void fetchOffers().then((items) => {
      if (!cancelled) {
        setOffers(items)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (!shouldRefreshScope(scope, 'content')) return
      clearSiteOffersCache()
      void fetchOffers().then((items) => setOffers(items))
    })
  }, [])

  return { offers, loading }
}
