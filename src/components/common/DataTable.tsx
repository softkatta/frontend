import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { TableToolbar } from './TableToolbar'
import { TablePagination } from './TablePagination'
import { useTableData, type TableFilterConfig } from '@/hooks/useTableData'
import { cn } from '@/lib/utils'
import { AdminTableSkeleton } from '@/components/admin/shell/AdminPageSkeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (item: T) => void
  /** Render without outer card — use inside ChartCard */
  embedded?: boolean
  /** Fields to search across */
  searchKeys?: string[]
  searchPlaceholder?: string
  /** Dropdown filters */
  filters?: TableFilterConfig[]
  /** Rows per page — pass to enable pagination without search/filters */
  pageSize?: number
  pageSizeOptions?: number[]
  /** Server-driven pagination — skips client-side filter/slice */
  serverPagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }
  /** Controlled toolbar (use with serverPagination) */
  searchQuery?: string
  onSearchChange?: (value: string) => void
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClearFilters?: () => void
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No data found',
  emptyDescription,
  onRowClick,
  embedded = false,
  searchKeys,
  searchPlaceholder,
  filters: filterConfigs,
  pageSize: pageSizeProp,
  pageSizeOptions,
  serverPagination,
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
  filterValues: controlledFilterValues,
  onFilterChange: controlledOnFilterChange,
  onClearFilters: controlledOnClearFilters,
}: DataTableProps<T>) {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isServerMode = Boolean(serverPagination)
  const hasToolbar = Boolean(searchKeys?.length || filterConfigs?.length)
  const hasPagination = Boolean(hasToolbar || pageSizeProp != null || isServerMode)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeProp ?? serverPagination?.pageSize ?? 10)

  const effectiveSearchQuery = controlledOnSearchChange ? (controlledSearchQuery ?? '') : searchQuery
  const effectiveFilterValues = controlledOnFilterChange ? (controlledFilterValues ?? {}) : filterValues

  const handleSearchChange = (value: string) => {
    if (controlledOnSearchChange) {
      controlledOnSearchChange(value)
      return
    }
    setSearchQuery(value)
  }

  const handleFilterChange = (key: string, value: string) => {
    if (controlledOnFilterChange) {
      controlledOnFilterChange(key, value)
      return
    }
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    if (controlledOnClearFilters) {
      controlledOnClearFilters()
      return
    }
    setSearchQuery('')
    setFilterValues({})
  }

  const effectivePageSize = isServerMode
    ? (serverPagination?.pageSize ?? pageSize)
    : (hasPagination ? pageSize : data.length || 1)

  useEffect(() => {
    if (!isServerMode) {
      setPage(1)
    }
  }, [effectiveSearchQuery, effectiveFilterValues, pageSize, isServerMode])

  const { paginated, total, totalPages, page: safePage } = useTableData({
    data,
    searchKeys: isServerMode ? [] : searchKeys,
    searchQuery: isServerMode ? '' : effectiveSearchQuery,
    filters: isServerMode ? {} : effectiveFilterValues,
    page: isServerMode ? 1 : page,
    pageSize: isServerMode ? data.length || 1 : effectivePageSize,
  })

  const displayData = isServerMode ? data : (hasPagination ? paginated : data)
  const paginationPage = isServerMode ? (serverPagination?.page ?? 1) : safePage
  const paginationTotal = isServerMode ? (serverPagination?.total ?? data.length) : total
  const paginationTotalPages = isServerMode ? (serverPagination?.totalPages ?? 1) : totalPages

  const emptyDescriptionResolved = useMemo(() => {
    if (emptyDescription) return emptyDescription
    if (hasToolbar && data.length > 0 && paginationTotal === 0) {
      return 'Try adjusting your search or filters.'
    }
    return undefined
  }, [emptyDescription, hasToolbar, data.length, paginationTotal])

  const handlePageChange = (nextPage: number) => {
    if (isServerMode) {
      serverPagination?.onPageChange(nextPage)
      return
    }
    setPage(nextPage)
  }

  const handlePageSizeChange = (nextSize: number) => {
    if (isServerMode) {
      serverPagination?.onPageSizeChange?.(nextSize)
      return
    }
    setPageSize(nextSize)
  }

  if (isLoading) {
    if (isAdmin && !embedded) {
      return <AdminTableSkeleton rows={Math.min(pageSizeProp ?? serverPagination?.pageSize ?? 5, 8)} />
    }
    return (
      <Card className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </Card>
    )
  }

  const table = (
    <>
      {hasToolbar && (
        <TableToolbar
          searchQuery={effectiveSearchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchKeys?.length ? (searchPlaceholder ?? 'Search...') : ''}
          filters={filterConfigs}
          filterValues={effectiveFilterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          total={paginationTotal}
        />
      )}

      {displayData.length === 0 ? (
        <div className="p-8">
          <EmptyState title={emptyTitle} description={emptyDescriptionResolved} embedded={embedded} />
        </div>
      ) : (
        <Table className={embedded ? 'portal-data-table' : undefined}>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[var(--border)]">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  'border-[var(--border)]',
                  onRowClick ? 'cursor-pointer' : undefined,
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {hasPagination && paginationTotal > 0 && (
        <TablePagination
          page={paginationPage}
          totalPages={paginationTotalPages}
          total={paginationTotal}
          pageSize={effectivePageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </>
  )

  if (embedded) {
    return <div className="portal-data-table-wrap overflow-hidden">{table}</div>
  }

  return (
    <Card className={cn('overflow-hidden', isAdmin && 'admin-data-table')}>
      {table}
    </Card>
  )
}
