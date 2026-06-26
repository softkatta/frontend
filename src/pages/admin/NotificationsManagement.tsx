import { useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SendNotificationDialog, type SendNotificationValues } from '@/components/admin/SendNotificationDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapNotification } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const typeVariant = { info: 'default', success: 'success', warning: 'warning', error: 'destructive' } as const

type NotificationRow = ReturnType<typeof mapAdminNotification>

function mapAdminNotification(raw: unknown) {
  const base = mapNotification(raw)
  const item = asRecord(raw)
  const user = asRecord(item.user)
  return {
    ...base,
    recipient: user.name ? `${user.name} (${user.email})` : asString(user.email, 'Unknown'),
  }
}

export default function NotificationsManagement() {
  const fetcher = useCallback(() => adminApi.notifications.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminNotification), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [sendOpen, setSendOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSend = async (values: SendNotificationValues) => {
    setSending(true)
    try {
      await adminApi.notifications.send({
        title: values.title,
        message: values.message,
        type: values.type,
        target: values.target,
        user_id: values.target === 'specific_user' ? values.user_id : undefined,
      })
      toast({ title: 'Notifications sent', variant: 'success' })
      setSendOpen(false)
      await reload()
    } catch (err) {
      toast({ title: 'Send failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.notifications.delete(deleteTarget.id)
      toast({ title: 'Notification deleted', variant: 'success' })
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Communication"
        heroTitle="Notifications"
        heroDescription="Send announcements and manage in-app notifications for users."
        title="Notifications Management"
        description="Send and manage platform notifications"
        actions={
          <Button onClick={() => setSendOpen(true)} className="gap-2 rounded-xl glow-btn">
            Send Notification
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['title', 'message', 'recipient']}
          searchPlaceholder="Search notifications..."
          filters={[
            {
              key: 'type',
              label: 'Type',
              options: [
                { value: 'info', label: 'Info' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ],
            },
          ]}
          pageSize={5}
          columns={[
            { key: 'title', header: 'Title', className: 'font-medium' },
            { key: 'message', header: 'Message' },
            { key: 'recipient', header: 'Recipient' },
            { key: 'type', header: 'Type', render: (n) => <Badge variant={typeVariant[n.type as keyof typeof typeVariant]}>{n.type}</Badge> },
            { key: 'created_at', header: 'Date', render: (n) => formatDate(n.created_at) },
            { key: 'actions', header: 'Actions', className: 'w-[80px] text-right', render: (n) => (
              <TableActions actions={[
                { ...actionBtn('Delete notification', Trash2, () => setDeleteTarget(n)), variant: 'destructive' },
              ]} />
            ) },
          ]}
          data={items}
        />
      </PortalPageShell>

      <SendNotificationDialog open={sendOpen} onOpenChange={setSendOpen} saving={sending} onSubmit={handleSend} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete notification?"
        description="Remove this notification record permanently?"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
