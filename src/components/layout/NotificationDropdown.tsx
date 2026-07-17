import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ChevronRight, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { inboxApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapNotification } from '@/lib/apiMappers'
import { cn, formatDate, formatTimeAgo } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { markAllAsRead, markAsRead, setNotifications } from '@/store/slices/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { Notification } from '@/types'
import type { SidebarVariant } from './Sidebar'

const PREVIEW_LIMIT = 8

type NotificationTab = 'all' | 'unread'

interface NotificationDropdownProps {
  variant?: SidebarVariant
}

function notificationInitials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return (words[0]?.slice(0, 2) ?? 'N').toUpperCase()
}

export function NotificationDropdown({ variant = 'client' }: NotificationDropdownProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, unreadCount, isLoading } = useAppSelector((s) => s.notifications)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')

  const notificationsPath = variant === 'admin'
    ? '/admin/inbox'
    : variant === 'employee'
      ? '/employee/notifications'
      : variant === 'hr'
        ? '/hr/notifications'
        : '/dashboard/notifications'

  const refresh = useCallback(async () => {
    try {
      const data = unwrapList(await inboxApi.list()).map(mapNotification)
      dispatch(setNotifications(data))
    } catch {
      /* keep existing list */
    }
  }, [dispatch])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) void refresh()
  }

  const filtered = useMemo(() => {
    const list = activeTab === 'unread' ? items.filter((n) => !n.is_read) : items
    return list.slice(0, PREVIEW_LIMIT)
  }, [activeTab, items])

  const markRead = async (id: string) => {
    try {
      await inboxApi.markRead(id)
      dispatch(markAsRead(id))
    } catch (error) {
      toast({ title: 'Failed to mark as read', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const markAllRead = async () => {
    try {
      await inboxApi.markAllRead()
      dispatch(markAllAsRead())
    } catch (error) {
      toast({ title: 'Failed to update notifications', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const tabs: { id: NotificationTab; label: string; count: number }[] = [
    { id: 'all', label: 'View All', count: items.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ]

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
          <Bell className="h-5 w-5 text-[var(--brand-blue)]" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-blue)] px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,26rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-0 shadow-xl"
      >
        <div className="notification-dropdown-panel">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="text-base font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-[var(--muted-foreground)]"
                disabled={unreadCount === 0}
                aria-label="Mark all as read"
                onClick={() => void markAllRead()}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-[var(--muted-foreground)]"
                aria-label="Notification settings"
                onClick={() => {
                  setOpen(false)
                  navigate(notificationsPath)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-4 border-b border-[var(--border)] px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-[var(--brand-blue)]'
                    : 'text-[var(--muted-foreground)] hover:text-foreground',
                )}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--brand-blue)]" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
            ) : (
              filtered.map((n) => (
                <NotificationRow key={n.id} notification={n} onMarkRead={() => void markRead(n.id)} />
              ))
            )}
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3 text-center">
            <Link
              to={notificationsPath}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-blue)] hover:underline"
              onClick={() => setOpen(false)}
            >
              See More
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({
  notification: n,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--input)]/50',
        !n.is_read && 'bg-[var(--brand-blue)]/[0.03]',
      )}
      onClick={() => {
        if (!n.is_read) onMarkRead()
      }}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-[var(--brand-blue)]/10 text-xs font-semibold text-[var(--brand-blue)]">
          {notificationInitials(n.title)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-[var(--muted-foreground)]">{formatTimeAgo(n.created_at)}</span>
            {!n.is_read ? <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> : null}
          </div>
        </div>
        <p className="mb-2 text-xs text-[var(--muted-foreground)]">{formatDate(n.created_at)}</p>
        <p className="rounded-lg bg-[var(--input)] px-3 py-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {n.message}
        </p>
      </div>
    </button>
  )
}
