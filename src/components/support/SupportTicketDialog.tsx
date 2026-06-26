import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import type { SupportTicket } from '@/types'

export type SupportAssignee = { id: string; name: string }

type SupportTicketDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string | null
  mode: 'client' | 'admin'
  loading?: boolean
  ticket: SupportTicket | null
  assignees?: SupportAssignee[]
  onLoad: (id: string) => Promise<void>
  onReply: (message: string, isInternal?: boolean) => Promise<void>
  onUpdate?: (payload: { status?: string; priority?: string; assigned_to?: string | null }) => Promise<void>
}

const statusVariant = { open: 'warning', in_progress: 'default', resolved: 'success', closed: 'secondary', waiting_on_client: 'default' } as const

export function SupportTicketDialog({
  open,
  onOpenChange,
  ticketId,
  mode,
  loading,
  ticket,
  assignees = [],
  onLoad,
  onReply,
  onUpdate,
}: SupportTicketDialogProps) {
  const [message, setMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assigneeId, setAssigneeId] = useState('unassigned')

  useEffect(() => {
    if (open && ticketId) void onLoad(ticketId)
  }, [open, ticketId, onLoad])

  useEffect(() => {
    if (!open) {
      setMessage('')
      setStatus('')
      setPriority('')
      setAssigneeId('unassigned')
      setIsInternal(false)
    }
  }, [open])

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status)
      setPriority(ticket.priority)
      setAssigneeId(ticket.assignee_id ?? 'unassigned')
    }
  }, [ticket])

  const handleReply = async () => {
    if (!message.trim()) return
    setReplying(true)
    try {
      await onReply(message.trim(), mode === 'admin' && isInternal)
      setMessage('')
      setIsInternal(false)
      if (ticketId) await onLoad(ticketId)
    } finally {
      setReplying(false)
    }
  }

  const handleUpdate = async () => {
    if (!onUpdate || !ticket) return
    const nextAssignee = assigneeId === 'unassigned' ? null : assigneeId
    const currentAssignee = ticket.assignee_id ?? null
    await onUpdate({
      status: status !== ticket.status ? status : undefined,
      priority: priority !== ticket.priority ? priority : undefined,
      assigned_to: nextAssignee !== currentAssignee ? nextAssignee : undefined,
    })
    if (ticketId) await onLoad(ticketId)
  }

  const visibleReplies = ticket?.replies?.filter((r) => !r.is_internal || mode === 'admin') ?? []
  const assigneeChanged = ticket && (assigneeId === 'unassigned' ? null : assigneeId) !== (ticket.assignee_id ?? null)
  const metaChanged = ticket && (status !== ticket.status || priority !== ticket.priority || assigneeChanged)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket?.subject ?? 'Support ticket'}</DialogTitle>
          <DialogDescription>
            {ticket?.ticket_number ? `#${ticket.ticket_number} · ` : ''}
            {ticket ? formatDate(ticket.created_at) : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {loading && !ticket ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : ticket ? (
          <div className="space-y-4">
            {mode === 'admin' && (ticket.customer_name || ticket.customer_email) && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{ticket.customer_name ?? 'Customer'}</p>
                {ticket.customer_email && (
                  <p className="text-[var(--muted-foreground)]">{ticket.customer_email}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant[ticket.status] ?? 'secondary'}>{ticket.status.replace(/_/g, ' ')}</Badge>
              <Badge variant="outline">{ticket.priority} priority</Badge>
              {mode === 'admin' && ticket.assignee_name && (
                <Badge variant="outline">Assigned: {ticket.assignee_name}</Badge>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--input-background)] p-4 text-sm leading-relaxed text-foreground">
              {ticket.description}
            </div>

            {mode === 'admin' && onUpdate && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['open', 'in_progress', 'waiting_on_client', 'resolved', 'closed'].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['low', 'medium', 'high', 'urgent'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Assign to</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {assignees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="button" variant="outline" size="sm" disabled={!metaChanged} onClick={() => void handleUpdate()}>
                    Update ticket
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Conversation</h4>
              {visibleReplies.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No replies yet.</p>
              ) : visibleReplies.map((reply) => (
                <div key={reply.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="font-medium text-foreground">{reply.user_name}</span>
                    <span>{formatDate(reply.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{reply.message}</p>
                  {reply.is_internal && mode === 'admin' && (
                    <Badge variant="outline" className="mt-2 text-[10px]">Internal note</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-reply">{mode === 'admin' ? 'Reply or internal note' : 'Your reply'}</Label>
              <textarea
                id="ticket-reply"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                placeholder="Type your message…"
              />
              {mode === 'admin' && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Internal note</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Only visible to admins</p>
                  </div>
                  <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button type="button" disabled={replying || !message.trim()} onClick={() => void handleReply()}>
            {replying ? 'Sending…' : mode === 'admin' && isInternal ? 'Add internal note' : 'Send reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
