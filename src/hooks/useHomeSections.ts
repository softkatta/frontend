import { useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import type { HomeSections } from '@/types/homeSections'

let cached: HomeSections | null = null
let versionCounter = 0
const listeners = new Set<() => void>()

export function clearHomeSectionsCache() {
  cached = null
  versionCounter += 1
  listeners.forEach((notify) => notify())
}

const DEFAULT: HomeSections = {
  demo_video: {
    label: 'Product Demo',
    title: 'See SoftKatta Solutions',
    highlight: 'in Action',
    description: 'Watch how Indian businesses manage GST billing, inventory, CRM, payroll, and customer relationships from one secure SoftKatta Solutions cloud platform.',
    video_url: '',
    cta_label: 'Browse products',
    cta_href: '/products',
  },
  technologies: [],
}

export function useHomeSections() {
  const [version, setVersion] = useState(versionCounter)
  const [sections, setSections] = useState<HomeSections>(() => cached ?? DEFAULT)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    const notify = () => setVersion(versionCounter)
    listeners.add(notify)
    return () => {
      listeners.delete(notify)
    }
  }, [])

  useEffect(() => {
    if (cached) {
      setSections(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void siteContentApi
      .homeSections()
      .then((data) => {
        if (cancelled) return
        cached = data
        setSections(data)
      })
      .catch(() => {
        if (!cancelled) setSections(DEFAULT)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [version])

  return {
    sections,
    loading,
    refresh: () => {
      clearHomeSectionsCache()
    },
  }
}
