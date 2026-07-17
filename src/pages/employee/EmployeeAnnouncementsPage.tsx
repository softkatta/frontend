import { useCallback, useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, asBool, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type AnnouncementRow = {
  id: string
  title: string
  body: string
  priority: string
  published_at: string
  is_read: boolean
  author_name: string
}

function priorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (priority === 'urgent' || priority === 'high') return 'destructive'
  if (priority === 'normal') return 'secondary'
  return 'outline'
}

export default function EmployeeAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AnnouncementRow[]>([])
  const [selected, setSelected] = useState<AnnouncementRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.announcements.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        const author = asRecord(row.author)
        return {
          id: asString(row.id),
          title: asString(row.title),
          body: asString(row.body),
          priority: asString(row.priority) || 'normal',
          published_at: asString(row.published_at),
          is_read: asBool(row.is_read),
          author_name: asString(author.name),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load announcements', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openAnnouncement = async (row: AnnouncementRow) => {
    setSelected(row)
    if (!row.is_read) {
      try {
        await employeeApi.announcements.markRead(row.id)
        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, is_read: true } : item)))
        setSelected((prev) => (prev ? { ...prev, is_read: true } : prev))
      } catch {
        /* ignore mark-read failures */
      }
    }
  }

  const unread = rows.filter((r) => !r.is_read).length

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Company updates"
        title="Announcements"
        description="Official notices from SoftKatta leadership and HR."
        aside={unread > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <span className="font-semibold">{unread}</span> unread
          </div>
        ) : undefined}
      />

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 font-medium">No announcements yet</p>
              <p className="text-sm text-[var(--muted-foreground)]">Check back later for company updates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => void openAnnouncement(row)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors hover:bg-[var(--input)]/40',
                    row.is_read
                      ? 'border-[var(--border)] bg-[var(--card)]'
                      : 'border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('font-semibold', !row.is_read && 'text-[var(--brand-blue)]')}>{row.title}</p>
                        {!row.is_read ? <Badge>New</Badge> : null}
                        <Badge variant={priorityVariant(row.priority)} className="capitalize">{row.priority}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{row.body}</p>
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        {row.published_at ? formatDate(row.published_at) : '—'}
                        {row.author_name ? ` · ${row.author_name}` : ''}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg shrink-0">
                      Read
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PortalPanel>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={priorityVariant(selected.priority)} className="capitalize">{selected.priority}</Badge>
                {selected.published_at ? (
                  <span className="text-xs text-[var(--muted-foreground)]">{formatDate(selected.published_at)}</span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.body}</p>
              {selected.author_name ? (
                <p className="text-xs text-[var(--muted-foreground)]">Posted by {selected.author_name}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PortalPage>
  )
}
