import { useEffect, useState } from 'react'
import { productsApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapApiProduct } from '@/lib/apiMappers'
import type { Product } from '@/types'

export function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [rawProducts, setRawProducts] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void productsApi
      .list()
      .then((raw) => {
        if (cancelled) return
        const list = unwrapList(raw)
        setRawProducts(list)
        setProducts(list.map(mapApiProduct))
        setError(list.length === 0)
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([])
          setRawProducts([])
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { products, rawProducts, loading, error }
}

export function usePublicProduct(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) {
      setProduct(null)
      setRaw(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    void productsApi
      .get(slug)
      .then((data) => {
        if (!cancelled) {
          setRaw(data)
          setProduct(mapApiProduct(data))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRaw(null)
          setProduct(null)
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { product, raw, loading, error }
}
