import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { portalNotificationTone } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { inboxApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapNotification } from '@/lib/apiMappers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { markAllAsRead, markAsRead, setNotifications } from '@/store/slices/notificationsSlice'
import { useAppDispatch } from '@/store/hooks'
import type { Notification } from '@/types'

const typeVariant = { info: 'default', success: 'success', warning: 'warning', error: 'destructive' } as const

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = unwrapList(await inboxApi.list()).map(mapNotification)
      setItems(data)
      dispatch(setNotifications(data))
    } catch (error) {
      toast({ title: 'Failed to load notifications', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => { void load() }, [load])

  const unreadCount = items.filter((n) => !n.is_read).length

  const markRead = async (id: string) => {
    try {
      await inboxApi.markRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      dispatch(markAsRead(id))
    } catch (error) {
      toast({ title: 'Failed to mark as read', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const markAllRead = async () => {
    try {
      await inboxApi.markAllRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      dispatch(markAllAsRead())
      toast({ title: 'All notifications marked as read', variant: 'success' })
    } catch (error) {
      toast({ title: 'Failed to update notifications', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <PortalPageShell
      eyebrow="Inbox"
      heroTitle="Notifications"
      heroDescription="Stay updated on orders, subscriptions, and account activity."
      title="Notifications"
      description={`${unreadCount} unread notifications`}
      actions={
        unreadCount > 0 ? (
          <Button variant="outline" className="rounded-xl" onClick={() => void markAllRead()}>
            Mark All Read
          </Button>
        ) : undefined
      }
      loading={loading}
    >
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
        ) : items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${portalNotificationTone[n.type]} ${!n.is_read ? 'ring-1 ring-[var(--brand-blue)]/20' : ''}`}
          >
            <div className="flex flex-1 gap-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]" />
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                  <Badge variant={typeVariant[n.type]} className="text-[10px]">{n.type}</Badge>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-[var(--brand-teal)]" />}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{n.message}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{formatDate(n.created_at)}</p>
              </div>
            </div>
            {!n.is_read && (
              <Button variant="ghost" size="sm" onClick={() => void markRead(n.id)}>Mark Read</Button>
            )}
          </div>
        ))}
      </div>
    </PortalPageShell>
  )
}
