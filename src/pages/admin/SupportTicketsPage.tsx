import { useCallback, useEffect, useState } from 'react'
import { Eye, MessageSquare } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { SupportTicketDialog, type SupportAssignee } from '@/components/support/SupportTicketDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList, asRecord, asString } from '@/lib/apiHelpers'
import { mapAdminSupportTicket, mapSupportTicket } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { SupportTicket } from '@/types'

const statusVariant = { open: 'warning', in_progress: 'default', resolved: 'success', closed: 'secondary', waiting_on_client: 'default' } as const
const priorityVariant = { low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive' } as const

export default function SupportTicketsPage() {
  const fetcher = useCallback(() => adminApi.supportTickets.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminSupportTicket), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)
  const [assignees, setAssignees] = useState<SupportAssignee[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const rows = unwrapList(await adminApi.users.list({ role: 'super_admin' }))
        setAssignees(rows.map((raw) => {
          const item = asRecord(raw)
          return { id: asString(item.id), name: asString(item.name, 'Admin') }
        }))
      } catch {
        setAssignees([])
      }
    })()
  }, [])

  const loadTicket = useCallback(async (id: string) => {
    setTicketLoading(true)
    try {
      const data = await adminApi.supportTickets.get(id)
      setTicket(mapSupportTicket(data))
    } catch (err) {
      toast({ title: 'Failed to load ticket', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setTicketLoading(false)
    }
  }, [])

  const handleReply = async (message: string, isInternal?: boolean) => {
    if (!activeId) return
    await adminApi.supportTickets.reply(activeId, { message, is_internal: isInternal })
    toast({ title: 'Reply sent', variant: 'success' })
    await reload()
  }

  const handleUpdate = async (payload: { status?: string; priority?: string; assigned_to?: string | null }) => {
    if (!activeId) return
    await adminApi.supportTickets.update(activeId, payload)
    toast({ title: 'Ticket updated', variant: 'success' })
    await reload()
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Support"
        heroTitle="Support Tickets"
        heroDescription="Respond to customer support requests and track ticket status."
        title="Support Tickets"
        description="Manage customer support requests"
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['subject', 'customer']}
          searchPlaceholder="Search tickets..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'waiting_on_client', label: 'Waiting on Client' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]},
            { key: 'priority', label: 'Priority', options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'subject', header: 'Subject', className: 'font-medium' },
            { key: 'customer', header: 'Customer' },
            { key: 'status', header: 'Status', render: (t) => <Badge variant={statusVariant[t.status as keyof typeof statusVariant] ?? 'secondary'}>{t.status.replace(/_/g, ' ')}</Badge> },
            { key: 'priority', header: 'Priority', render: (t) => <Badge variant={priorityVariant[t.priority as keyof typeof priorityVariant] ?? 'secondary'}>{t.priority}</Badge> },
            { key: 'created_at', header: 'Created', render: (t) => formatDate(t.created_at) },
            { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (t) => (
              <TableActions actions={[
                actionBtn('View ticket', Eye, () => { setActiveId(t.id); setTicket(null) }),
                actionBtn('Respond', MessageSquare, () => { setActiveId(t.id); setTicket(null) }),
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <SupportTicketDialog
        open={Boolean(activeId)}
        onOpenChange={(open) => { if (!open) { setActiveId(null); setTicket(null) } }}
        ticketId={activeId}
        mode="admin"
        loading={ticketLoading}
        ticket={ticket}
        onLoad={loadTicket}
        onReply={handleReply}
        onUpdate={handleUpdate}
        assignees={assignees}
      />
    </>
  )
}
