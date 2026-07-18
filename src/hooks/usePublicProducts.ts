import { useEffect, useState } from 'react'
import { productsApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapApiProduct } from '@/lib/apiMappers'
import type { Product } from '@/types'

type ProductListCache = {
  rawProducts: unknown[]
  products: Product[]
}

let listCache: ProductListCache | null = null
let listInflight: Promise<ProductListCache> | null = null
const productCache = new Map<string, { raw: unknown; product: Product }>()
const productInflight = new Map<string, Promise<{ raw: unknown; product: Product }>>()

export function clearPublicProductsCache() {
  listCache = null
  listInflight = null
  productCache.clear()
  productInflight.clear()
}

async function fetchProductList(): Promise<ProductListCache> {
  if (listCache) return listCache
  if (listInflight) return listInflight

  listInflight = productsApi
    .list({ lite: true })
    .then((raw) => {
      const list = unwrapList(raw)
      const products = list.map(mapApiProduct)
      listCache = { rawProducts: list, products }
      for (let i = 0; i < products.length; i += 1) {
        const product = products[i]
        productCache.set(product.slug, { raw: list[i], product })
      }
      return listCache
    })
    .finally(() => {
      listInflight = null
    })

  return listInflight
}

export function prefetchPublicProducts() {
  void fetchProductList()
}

async function fetchProduct(slug: string): Promise<{ raw: unknown; product: Product }> {
  const cached = productCache.get(slug)
  if (cached) return cached

  const inflight = productInflight.get(slug)
  if (inflight) return inflight

  const promise = (async () => {
    const raw = await productsApi.get(slug)
    const product = mapApiProduct(raw)
    const entry = { raw, product }
    productCache.set(slug, entry)

    if (listCache) {
      const idx = listCache.products.findIndex((item) => item.slug === slug)
      if (idx >= 0) {
        listCache.products[idx] = product
        listCache.rawProducts[idx] = raw
      }
    }

    return entry
  })().finally(() => {
    productInflight.delete(slug)
  })

  productInflight.set(slug, promise)
  return promise
}

export function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>(listCache?.products ?? [])
  const [rawProducts, setRawProducts] = useState<unknown[]>(listCache?.rawProducts ?? [])
  const [loading, setLoading] = useState(!listCache)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchProductList()
      .then(({ rawProducts: raw, products: items }) => {
        if (cancelled) return
        setRawProducts(raw)
        setProducts(items)
        setError(items.length === 0)
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
  const cached = slug ? productCache.get(slug) : undefined
  const [product, setProduct] = useState<Product | null>(cached?.product ?? null)
  const [raw, setRaw] = useState<unknown>(cached?.raw ?? null)
  const [loading, setLoading] = useState(Boolean(slug) && !cached)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) {
      setProduct(null)
      setRaw(null)
      setLoading(false)
      return
    }

    const existing = productCache.get(slug)
    if (existing) {
      setProduct(existing.product)
      setRaw(existing.raw)
      setLoading(false)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    void fetchProduct(slug)
      .then((entry) => {
        if (!cancelled) {
          setRaw(entry.raw)
          setProduct(entry.product)
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
