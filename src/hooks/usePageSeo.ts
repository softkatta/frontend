import { useEffect, useMemo } from 'react'
import { applyPageSeo, type ApplyPageSeoOptions } from '@/lib/seo/applyPageSeo'

export function usePageSeo(options: ApplyPageSeoOptions | null | undefined) {
  const title = options?.title
  const description = options?.description
  const keywords = options?.keywords
  const path = options?.path
  const ogType = options?.ogType
  const noindex = options?.noindex
  const image = options?.image
  const siteName = options?.siteName
  const jsonLd = options?.jsonLd
  const jsonLdKey = useMemo(() => (jsonLd ? JSON.stringify(jsonLd) : ''), [jsonLd])

  useEffect(() => {
    if (!options) return
    applyPageSeo(options)
  }, [options, title, description, keywords, path, ogType, noindex, image, siteName, jsonLdKey])
}
