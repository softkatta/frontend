import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TableFilterConfig } from '@/hooks/useTableData'
import { cn } from '@/lib/utils'

interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: TableFilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClearFilters?: () => void
  total?: number
}

function filterLabel(filter: TableFilterConfig, value: string) {
  if (!value || value === 'all') return `All ${filter.label}`
  return filter.options.find((o) => o.value === value)?.label ?? value
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  total,
}: TableToolbarProps) {
  const hasSearch = searchPlaceholder !== ''
  const hasFilters = filters.length > 0
  const hasActiveFilters = filters.some((filter) => (filterValues[filter.key] ?? 'all') !== 'all')
  const hasActiveSearch = searchQuery.trim().length > 0

  if (!hasSearch && !hasFilters) return null

  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--input)]/50 to-[var(--card)] px-4 py-3.5 portal-table-toolbar">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {hasSearch && (
          <div className="relative w-full xl:max-w-xs xl:shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 rounded-xl border-[var(--border)] bg-[var(--input-background)] pl-10"
            />
          </div>
        )}

        {hasFilters && (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const current = filterValues[filter.key] ?? 'all'
              const isActive = current !== 'all'

              return (
                <Select
                  key={filter.key}
                  value={current}
                  onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                  <SelectTrigger
                    className={cn(
                      'h-10 w-full min-w-[140px] rounded-xl border-[var(--border)] bg-[var(--input-background)] text-sm font-medium sm:w-auto sm:min-w-[148px]',
                      isActive && 'border-[var(--brand-teal)]/40 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]',
                    )}
                  >
                    <SelectValue placeholder={`All ${filter.label}`}>
                      {filterLabel(filter, current)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" className="min-w-[10rem]">
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            })}

            {(hasActiveFilters || hasActiveSearch) && onClearFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl text-[var(--muted-foreground)]"
                onClick={onClearFilters}
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        )}

        {total != null && (
          <p className="shrink-0 text-sm text-[var(--muted-foreground)] xl:ml-auto">
            <span className="font-semibold text-foreground">{total}</span>
            {' '}
            {total === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>
    </div>
  )
}
