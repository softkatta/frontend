import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { adminNav } from '@/lib/adminNavigation'
import { useAuth } from '@/hooks/useAuth'
import { canAccessPath } from '@/lib/accessControl'
import { cn } from '@/lib/utils'

interface AdminQuickSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminQuickSearch({ open, onOpenChange }: AdminQuickSearchProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')

  const items = useMemo(
    () => adminNav.filter((item) => canAccessPath(user, item.to)),
    [user],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 8)
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.to.toLowerCase().includes(q),
    )
  }, [items, query])

  const goTo = useCallback(
    (path: string) => {
      onOpenChange(false)
      setQuery('')
      navigate(path)
    },
    [navigate, onOpenChange],
  )

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-quick-search gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
          <DialogTitle className="sr-only">Quick navigation</DialogTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin pages..."
              className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
            />
          </div>
        </DialogHeader>
        <ul className="max-h-[min(60vh,22rem)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No pages match your search.
            </li>
          ) : (
            results.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      'hover:bg-[var(--input)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/30',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
                      <Icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{item.label}</span>
                      <span className="block truncate text-xs text-[var(--muted-foreground)]">{item.to}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                  </button>
                </li>
              )
            })
          )}
        </ul>
        <div className="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted-foreground)]">
          <kbd className="rounded border border-[var(--border)] bg-[var(--input)] px-1.5 py-0.5 font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="rounded border border-[var(--border)] bg-[var(--input)] px-1.5 py-0.5 font-mono">K</kbd>
          {' to open anytime'}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AdminQuickSearchTriggerProps {
  onClick: () => void
  className?: string
}

export function AdminQuickSearchTrigger({ onClick, className }: AdminQuickSearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'admin-quick-search-trigger hidden md:flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--input)]/50 px-3 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--input)] hover:text-foreground',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search admin...</span>
      <kbd className="hidden rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 font-mono text-[10px] lg:inline">
        Ctrl K
      </kbd>
    </button>
  )
}
