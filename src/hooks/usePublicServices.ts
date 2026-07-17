import { useEffect, useState } from 'react'
import { servicesApi, type ServiceItem } from '@/services/api/modules/services.api'
import { unwrapList } from '@/lib/apiHelpers'

let cache: ServiceItem[] | null = null
let inflight: Promise<ServiceItem[]> | null = null
const serviceCache = new Map<string, ServiceItem>()
const serviceInflight = new Map<string, Promise<ServiceItem>>()

export function clearPublicServicesCache() {
  cache = null
  inflight = null
  serviceCache.clear()
  serviceInflight.clear()
}

async function fetchServices(): Promise<ServiceItem[]> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = servicesApi
    .list()
    .then((raw) => {
      const items = unwrapList(raw) as ServiceItem[]
      cache = items
      for (const item of items) {
        serviceCache.set(item.slug, item)
      }
      return items
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function prefetchPublicServices() {
  void fetchServices()
}

async function fetchService(slug: string): Promise<ServiceItem> {
  const cached = serviceCache.get(slug)
  if (cached) return cached

  const pending = serviceInflight.get(slug)
  if (pending) return pending

  const promise = (async () => {
    const fromList = cache?.find((item) => item.slug === slug)
    if (fromList) return fromList

    const raw = await servicesApi.get(slug)
    const item = raw as ServiceItem
    serviceCache.set(slug, item)
    return item
  })().finally(() => {
    serviceInflight.delete(slug)
  })

  serviceInflight.set(slug, promise)
  return promise
}

export function usePublicServices() {
  const [services, setServices] = useState<ServiceItem[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let cancelled = false
    void fetchServices().then((items) => {
      if (!cancelled) {
        setServices(items)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { services, loading }
}

export function usePublicService(slug: string | undefined) {
  const cached = slug ? serviceCache.get(slug) : undefined
  const [service, setService] = useState<ServiceItem | null>(cached ?? null)
  const [loading, setLoading] = useState(Boolean(slug) && !cached)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setService(null)
      setLoading(false)
      return
    }

    const existing = serviceCache.get(slug)
    if (existing) {
      setService(existing)
      setLoading(false)
      setNotFound(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)

    void fetchService(slug)
      .then((item) => {
        if (!cancelled) setService(item)
      })
      .catch(() => {
        if (!cancelled) {
          setService(null)
          setNotFound(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { service, loading, notFound }
}
