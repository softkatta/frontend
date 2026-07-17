import { useCallback, useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'
import type { PublicPageContent, PublicPageSeoEntry, PublicPagesPayload } from '@/types/pageContent'

let cache: PublicPagesPayload | null = null
let inflight: Promise<PublicPagesPayload> | null = null

export function clearPublicPageContentCache() {
  cache = null
  inflight = null
}

async function fetchPages(): Promise<PublicPagesPayload> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = siteContentApi
    .pages()
    .then((data) => {
      cache = {
        pages: data.pages ?? {},
        seo: data.seo ?? {},
      }
      return cache
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function usePublicPageContent(pageKey?: string) {
  const [payload, setPayload] = useState<PublicPagesPayload | null>(cache)
  const [loading, setLoading] = useState(!cache)

  const load = useCallback(async () => {
    try {
      const next = await fetchPages()
      setPayload(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'content')) {
        clearPublicPageContentCache()
        void load()
      }
    })
  }, [load])

  const page: PublicPageContent = pageKey ? (payload?.pages?.[pageKey] ?? {}) : {}
  const seoFor = (path: string): PublicPageSeoEntry => payload?.seo?.[path] ?? {}

  return { page, pages: payload?.pages ?? {}, seo: payload?.seo ?? {}, seoFor, loading, refresh: load }
}

export function usePublicPageSeo(pathname: string) {
  const { seoFor, loading } = usePublicPageContent()
  return { seo: seoFor(pathname), loading }
}
