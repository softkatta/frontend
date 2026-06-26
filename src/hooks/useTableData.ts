import { useMemo } from 'react'

export type TableFilterConfig = {
  key: string
  label: string
  options: { value: string; label: string }[]
}

export type TableFilterValues = Record<string, string>

type UseTableDataOptions<T> = {
  data: T[]
  searchKeys?: string[]
  searchQuery?: string
  filters?: TableFilterValues
  page?: number
  pageSize?: number
}

function getFieldValue(item: Record<string, unknown>, key: string): unknown {
  return item[key]
}

export function useTableData<T extends { id: string }>({
  data,
  searchKeys = [],
  searchQuery = '',
  filters = {},
  page = 1,
  pageSize = 10,
}: UseTableDataOptions<T>) {
  const filtered = useMemo(() => {
    let result = data
    const query = searchQuery.trim().toLowerCase()

    if (query && searchKeys.length > 0) {
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = getFieldValue(item as Record<string, unknown>, key)
          return value != null && String(value).toLowerCase().includes(query)
        }),
      )
    }

    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === 'all') continue
      result = result.filter((item) => String(getFieldValue(item as Record<string, unknown>, key)) === value)
    }

    return result
  }, [data, searchKeys, searchQuery, filters])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  return { filtered, paginated, total, totalPages, page: safePage }
}
