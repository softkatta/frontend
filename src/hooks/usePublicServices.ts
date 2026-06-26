import { useEffect, useState } from 'react'
import { servicesApi, type ServiceItem } from '@/services/api/modules/services.api'
import { unwrapList } from '@/lib/apiHelpers'

export function usePublicServices() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void servicesApi
      .list()
      .then((raw) => {
        if (cancelled) return
        setServices(unwrapList(raw) as ServiceItem[])
      })
      .catch(() => {
        if (!cancelled) setServices([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { services, loading }
}

export function usePublicService(slug: string | undefined) {
  const [service, setService] = useState<ServiceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setService(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)

    void servicesApi
      .get(slug)
      .then((raw) => {
        if (cancelled) return
        setService(raw as ServiceItem)
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
