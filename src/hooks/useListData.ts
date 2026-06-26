import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiHelpers'

export function useListData<T>(fetcher: () => Promise<unknown>, mapper: (raw: unknown) => T[]) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetcher()
      setItems(mapper(response))
    } catch (err) {
      setError(getApiErrorMessage(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [fetcher, mapper])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, setItems, loading, error, reload }
}
