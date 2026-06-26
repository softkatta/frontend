import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { inboxApi } from '@/services/api'
import { unwrapList, asRecord } from '@/lib/apiHelpers'
import { mapNotification } from '@/lib/apiMappers'
import { addNotification, setNotifications } from '@/store/slices/notificationsSlice'
import { useAppDispatch } from '@/store/hooks'
import { getEcho } from '@/lib/echo'
import { toast } from '@/components/ui/toaster'
import type { Notification } from '@/types'

/** Sync inbox notifications and subscribe to Pusher for real-time updates. */
export function useNotificationsSync(enabled = true) {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!enabled || !isAuthenticated || !user) return

    let cancelled = false
    let channelName: string | null = null

    void (async () => {
      try {
        const data = unwrapList(await inboxApi.list()).map(mapNotification)
        if (!cancelled) dispatch(setNotifications(data))
      } catch {
        /* badge stays at 0 if fetch fails */
      }

      const echo = await getEcho()
      if (!echo || cancelled) return

      channelName = `user.${user.id}`
      echo.private(channelName).listen('.notification.created', (payload: unknown) => {
        const item = asRecord(payload)
        const notification: Notification = {
          id: String(item.id ?? ''),
          type: (item.type as Notification['type']) ?? 'info',
          title: String(item.title ?? ''),
          message: String(item.message ?? ''),
          is_read: Boolean(item.is_read),
          created_at: String(item.created_at ?? new Date().toISOString()),
        }

        if (!notification.id) return

        dispatch(addNotification(notification))
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        })
      })
    })()

    return () => {
      cancelled = true
      if (channelName) {
        void getEcho().then((echo) => {
          echo?.leave(channelName!)
        })
      }
    }
  }, [dispatch, enabled, isAuthenticated, user])
}
