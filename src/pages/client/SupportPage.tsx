import { useCallback, useState } from 'react'
import { Eye, MessageSquare } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SupportTicketDialog } from '@/components/support/SupportTicketDialog'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapSupportTicket } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { SupportTicket } from '@/types'

const statusVariant = { open: 'warning', in_progress: 'default', resolved: 'success', closed: 'secondary', waiting_on_client: 'default' } as const
const priorityVariant = { low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive' } as const

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  const fetcher = useCallback(() => clientApi.support.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapSupportTicket), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await clientApi.support.create({ subject, description, priority: 'medium' })
      toast({ title: 'Ticket created', description: 'Our team will respond within 24 hours.', variant: 'success' })
      setSubject('')
      setDescription('')
      setShowForm(false)
      await reload()
    } catch (err) {
      toast({ title: 'Failed to create ticket', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const loadTicket = useCallback(async (id: string) => {
    setTicketLoading(true)
    try {
      const data = await clientApi.support.get(id)
      setTicket(mapSupportTicket(data))
    } catch (err) {
      toast({ title: 'Failed to load ticket', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setTicketLoading(false)
    }
  }, [])

  const handleReply = async (message: string) => {
    if (!activeId) return
    await clientApi.support.reply(activeId, { message })
    toast({ title: 'Reply sent', variant: 'success' })
    await reload()
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Help"
        heroTitle="Support"
        heroDescription="Open tickets and get help from the SoftKatta support team."
        title="Support"
        description="Get help from our support team"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="rounded-xl glow-btn">
            {showForm ? 'Cancel' : 'New Ticket'}
          </Button>
        }
        error={error}
      >
        <div className="space-y-6">
          {showForm && (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                />
              </div>
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Ticket'}</Button>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
          ) : (
            <DataTable
              embedded
              searchKeys={['subject']}
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
                { key: 'status', header: 'Status', render: (t) => <Badge variant={statusVariant[t.status] ?? 'secondary'}>{t.status.replace(/_/g, ' ')}</Badge> },
                { key: 'priority', header: 'Priority', render: (t) => <Badge variant={priorityVariant[t.priority] ?? 'secondary'}>{t.priority}</Badge> },
                { key: 'created_at', header: 'Created', render: (t) => formatDate(t.created_at) },
                { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (t) => (
                  <TableActions actions={[
                    actionBtn('View ticket', Eye, () => { setActiveId(t.id); setTicket(null) }),
                    actionBtn('Reply', MessageSquare, () => { setActiveId(t.id); setTicket(null) }),
                  ]} />
                ) },
              ]}
            />
          )}
        </div>
      </PortalPageShell>

      <SupportTicketDialog
        open={Boolean(activeId)}
        onOpenChange={(open) => { if (!open) { setActiveId(null); setTicket(null) } }}
        ticketId={activeId}
        mode="client"
        loading={ticketLoading}
        ticket={ticket}
        onLoad={loadTicket}
        onReply={handleReply}
      />
    </>
  )
}
