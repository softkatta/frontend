import { useCallback, useEffect, useState } from 'react'
import { LifeBuoy, Pencil, Plus } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type TicketRow = {
  id: string
  ticket_no: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  assigned_to_name: string
  resolution_notes: string
  created_at: string
}

const CATEGORIES = [
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'access', label: 'Access' },
  { value: 'other', label: 'Other' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const emptyForm = {
  subject: '',
  description: '',
  category: 'it',
  priority: 'medium',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'resolved' || status === 'closed') return 'default'
  if (status === 'in_progress') return 'secondary'
  if (status === 'waiting') return 'outline'
  return 'destructive'
}

function priorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (priority === 'urgent' || priority === 'high') return 'destructive'
  if (priority === 'medium') return 'secondary'
  return 'outline'
}

function canEditTicket(status: string) {
  return status === 'open' || status === 'waiting'
}

export default function EmployeeHelpdeskPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<TicketRow[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSaving, setEditSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.helpdesk.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          ticket_no: asString(row.ticket_no),
          subject: asString(row.subject),
          description: asString(row.description),
          category: asString(row.category) || 'other',
          priority: asString(row.priority) || 'medium',
          status: asString(row.status) || 'open',
          assigned_to_name: asString(row.assigned_to_name),
          resolution_notes: asString(row.resolution_notes),
          created_at: asString(row.created_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load tickets', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      await employeeApi.helpdesk.create({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      })
      toast({ title: 'Ticket submitted', variant: 'success' })
      setFormOpen(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      toast({ title: 'Submit failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (row: TicketRow) => {
    setEditForm({
      subject: row.subject,
      description: row.description,
      category: row.category,
      priority: row.priority,
    })
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!selected || !editForm.subject.trim() || !editForm.description.trim()) return
    setEditSaving(true)
    try {
      await employeeApi.helpdesk.update(selected.id, {
        subject: editForm.subject.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        priority: editForm.priority,
      })
      toast({ title: 'Ticket updated', variant: 'success' })
      setEditOpen(false)
      setSelected(null)
      await load()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const handleClose = async () => {
    if (!selected) return
    setEditSaving(true)
    try {
      await employeeApi.helpdesk.update(selected.id, { status: 'closed' })
      toast({ title: 'Ticket closed' })
      setEditOpen(false)
      setSelected(null)
      await load()
    } catch (err) {
      toast({ title: 'Close failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const openCount = rows.filter((r) => !['resolved', 'closed'].includes(r.status)).length

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Internal support"
        title="Help desk"
        description="Raise IT, HR, and facilities requests and track their status."
        aside={(
          <Button className="rounded-xl glow-btn" onClick={() => { setForm(emptyForm); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            New ticket
          </Button>
        )}
      />

      {openCount > 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm w-fit">
          <span className="font-semibold">{openCount}</span> open / in progress
        </div>
      ) : null}

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <LifeBuoy className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 font-medium">No tickets yet</p>
              <p className="text-sm text-[var(--muted-foreground)]">Submit a request when you need help from IT or HR.</p>
              <Button className="mt-4 rounded-xl" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Raise ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors hover:bg-[var(--input)]/40',
                    ['resolved', 'closed'].includes(row.status)
                      ? 'border-[var(--border)] bg-[var(--card)]'
                      : 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/5',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.subject}</p>
                        <Badge variant={statusVariant(row.status)} className="capitalize">{row.status.replace(/_/g, ' ')}</Badge>
                        <Badge variant={priorityVariant(row.priority)} className="capitalize">{row.priority}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {row.ticket_no}
                        {' · '}
                        <span className="capitalize">{row.category}</span>
                        {row.created_at ? ` · ${formatDate(row.created_at)}` : ''}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">{row.description}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg shrink-0">View</Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PortalPanel>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">New help desk ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="button" className="rounded-xl" disabled={saving || !form.subject.trim() || !form.description.trim()} onClick={() => void handleCreate()}>
              {saving ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(selected.status)} className="capitalize">{selected.status.replace(/_/g, ' ')}</Badge>
                <Badge variant={priorityVariant(selected.priority)} className="capitalize">{selected.priority}</Badge>
                <span className="text-xs text-[var(--muted-foreground)]">{selected.ticket_no}</span>
              </div>
              <p className="whitespace-pre-wrap">{selected.description}</p>
              {selected.assigned_to_name ? (
                <p className="text-xs text-[var(--muted-foreground)]">Assigned to {selected.assigned_to_name}</p>
              ) : null}
              {selected.resolution_notes ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Resolution</p>
                  <p className="mt-1 whitespace-pre-wrap">{selected.resolution_notes}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelected(null)}>Close</Button>
            {selected && canEditTicket(selected.status) ? (
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => openEdit(selected)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit ticket
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              disabled={editSaving}
              onClick={() => void handleClose()}
            >
              Close ticket
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={editSaving || !editForm.subject.trim() || !editForm.description.trim()}
              onClick={() => void handleUpdate()}
            >
              {editSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  )
}
