import { useEffect } from 'react'
import { applyPageSeo, type ApplyPageSeoOptions } from '@/lib/seo/applyPageSeo'

export function usePageSeo(options: ApplyPageSeoOptions | null | undefined) {
  useEffect(() => {
    if (!options) return
    applyPageSeo(options)
  }, [
    options?.title,
    options?.description,
    options?.keywords,
    options?.path,
    options?.ogType,
    options?.noindex,
    options?.image,
    options?.siteName,
  ])
}
