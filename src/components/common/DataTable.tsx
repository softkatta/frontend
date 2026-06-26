import { type ReactNode, useEffect, useMemo, useState } from 'react'
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
}: DataTableProps<T>) {
  const hasToolbar = Boolean(searchKeys?.length || filterConfigs?.length)
  const hasPagination = Boolean(hasToolbar || pageSizeProp != null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeProp ?? 10)

  const effectivePageSize = hasPagination ? pageSize : data.length || 1

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterValues, pageSize])

  const { paginated, total, totalPages, page: safePage } = useTableData({
    data,
    searchKeys,
    searchQuery,
    filters: filterValues,
    page,
    pageSize: effectivePageSize,
  })

  const displayData = hasPagination ? paginated : data

  const emptyDescriptionResolved = useMemo(() => {
    if (emptyDescription) return emptyDescription
    if (hasToolbar && data.length > 0 && total === 0) {
      return 'Try adjusting your search or filters.'
    }
    return undefined
  }, [emptyDescription, hasToolbar, data.length, total])

  if (isLoading) {
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
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchKeys?.length ? (searchPlaceholder ?? 'Search...') : ''}
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={(key, value) =>
            setFilterValues((prev) => ({ ...prev, [key]: value }))
          }
          onClearFilters={() => {
            setSearchQuery('')
            setFilterValues({})
          }}
          total={total}
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

      {hasPagination && total > 0 && (
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          total={total}
          pageSize={effectivePageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </>
  )

  if (embedded) {
    return <div className="portal-data-table-wrap overflow-hidden">{table}</div>
  }

  return (
    <Card className="overflow-hidden">
      {table}
    </Card>
  )
}
