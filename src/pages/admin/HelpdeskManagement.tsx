import { useCallback, useEffect, useMemo, useState } from 'react'
import { LifeBuoy, Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable, type Column } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
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
import { adminApi } from '@/services/api'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type EmployeeOption = { id: string; label: string }

type TicketRow = {
  id: string
  ticket_no: string
  employee_id: string
  employee_name: string
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

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const

const emptyForm = {
  employee_id: '',
  subject: '',
  description: '',
  category: 'it',
  priority: 'medium',
  status: 'open',
  assigned_to_name: '',
  resolution_notes: '',
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

function mapRow(raw: unknown): TicketRow {
  const item = asRecord(raw)
  const employee = asRecord(item.employee)
  return {
    id: asString(item.id),
    ticket_no: asString(item.ticket_no),
    employee_id: asString(item.employee_id),
    employee_name: asString(employee.full_name),
    subject: asString(item.subject),
    description: asString(item.description),
    category: asString(item.category) || 'other',
    priority: asString(item.priority) || 'medium',
    status: asString(item.status) || 'open',
    assigned_to_name: asString(item.assigned_to_name),
    resolution_notes: asString(item.resolution_notes),
    created_at: asString(item.created_at),
  }
}

export default function HelpdeskManagement() {
  const [items, setItems] = useState<TicketRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TicketRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TicketRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadEmployees = useCallback(async () => {
    try {
      const raw = asRecord(await adminApi.employees.list({ status: 'active' }))
      setEmployees(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        const name = asString(row.full_name) || asString(row.name)
        const code = asString(row.employee_code)
        return { id: asString(row.id), label: code ? `${name} (${code})` : name }
      }).filter((e) => e.id && e.label))
    } catch {
      setEmployees([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = asRecord(await adminApi.helpdesk.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }))
      setItems(unwrapList(raw.data ?? raw).map(mapRow))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { void loadEmployees() }, [loadEmployees])
  useEffect(() => { void load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: TicketRow) => {
    setEditing(row)
    setForm({
      employee_id: row.employee_id,
      subject: row.subject,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigned_to_name: row.assigned_to_name,
      resolution_notes: row.resolution_notes,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.employee_id || !form.subject.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      const payload = {
        employee_id: Number(form.employee_id),
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
        assigned_to_name: form.assigned_to_name.trim() || null,
        resolution_notes: form.resolution_notes.trim() || null,
      }
      if (editing) {
        await adminApi.helpdesk.update(editing.id, payload)
        toast({ title: 'Ticket updated', variant: 'success' })
      } else {
        await adminApi.helpdesk.create(payload)
        toast({ title: 'Ticket created', variant: 'success' })
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.helpdesk.delete(deleteTarget.id)
      toast({ title: 'Ticket deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<TicketRow>[] = useMemo(() => [
    {
      key: 'ticket_no',
      header: 'Ticket',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.subject}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{row.ticket_no} · {row.employee_name || '—'}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge variant={priorityVariant(row.priority)} className="capitalize">{row.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status)} className="capitalize">{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'assigned_to_name',
      header: 'Assignee',
      render: (row) => row.assigned_to_name || '—',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => (row.created_at ? formatDate(row.created_at) : '—'),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (row) => (
        <TableActions
          actions={[
            actionBtn('Edit', Pencil, () => openEdit(row)),
            { ...actionBtn('Delete', Trash2, () => setDeleteTarget(row)), variant: 'destructive' },
          ]}
        />
      ),
    },
  ], [])

  return (
    <>
      <PortalPageShell
        eyebrow="Internal support"
        heroTitle="Help desk"
        heroDescription="Track IT, HR, and facilities requests from employees."
        title="Manage tickets"
        description="Triage, assign, and resolve internal tickets"
        loading={loading}
        error={error}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Button className="rounded-xl glow-btn" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New ticket
            </Button>
          </div>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['ticket_no', 'subject', 'employee_name', 'category', 'status']}
          searchPlaceholder="Search tickets..."
          emptyTitle="No tickets"
          emptyDescription="Employee requests will appear here."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              {editing ? `Edit ${editing.ticket_no}` : 'New ticket'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <select
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Input value={form.assigned_to_name} onChange={(e) => setForm({ ...form, assigned_to_name: e.target.value })} className="h-11 rounded-xl" placeholder="Owner name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resolution notes</Label>
              <textarea
                rows={3}
                value={form.resolution_notes}
                onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.employee_id || !form.subject.trim() || !form.description.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete ticket?"
        description={deleteTarget ? `Remove ${deleteTarget.ticket_no}?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
