import { useCallback, useEffect, useMemo, useState } from 'react'
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react'
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

type TrainingRow = {
  id: string
  title: string
  description: string
  category: string
  provider: string
  mode: string
  duration_hours: string
  starts_at: string
  due_at: string
  status: string
  completion_percent: number
  assigned_to: string
  assigned_name: string
  notes: string
}

const CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'technical', label: 'Technical' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'soft_skills', label: 'Soft skills' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
] as const

const MODES = [
  { value: 'online', label: 'Online' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'self_paced', label: 'Self-paced' },
  { value: 'workshop', label: 'Workshop' },
] as const

const STATUSES = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const emptyForm = {
  title: '',
  description: '',
  category: 'technical',
  provider: '',
  mode: 'online',
  duration_hours: '',
  starts_at: '',
  due_at: '',
  status: 'assigned',
  completion_percent: '0',
  assigned_to: '',
  notes: '',
}

function toApiDateTime(local: string): string | null {
  if (!local.trim()) return null
  const date = new Date(local)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function toLocalInput(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'completed') return 'default'
  if (status === 'in_progress') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function mapRow(raw: unknown): TrainingRow {
  const item = asRecord(raw)
  const assignee = asRecord(item.assignee)
  return {
    id: asString(item.id),
    title: asString(item.title),
    description: asString(item.description),
    category: asString(item.category) || 'other',
    provider: asString(item.provider),
    mode: asString(item.mode) || 'online',
    duration_hours: asString(item.duration_hours),
    starts_at: asString(item.starts_at),
    due_at: asString(item.due_at),
    status: asString(item.status) || 'assigned',
    completion_percent: Number(item.completion_percent ?? 0),
    assigned_to: asString(item.assigned_to),
    assigned_name: asString(assignee.full_name),
    notes: asString(item.notes),
  }
}

export default function TrainingManagement() {
  const [items, setItems] = useState<TrainingRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TrainingRow | null>(null)
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
      const raw = asRecord(await adminApi.training.list({
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

  const openEdit = (row: TrainingRow) => {
    setEditing(row)
    setForm({
      title: row.title,
      description: row.description,
      category: row.category,
      provider: row.provider,
      mode: row.mode,
      duration_hours: row.duration_hours,
      starts_at: toLocalInput(row.starts_at),
      due_at: toLocalInput(row.due_at),
      status: row.status,
      completion_percent: String(row.completion_percent),
      assigned_to: row.assigned_to,
      notes: row.notes,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.assigned_to) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        provider: form.provider.trim() || null,
        mode: form.mode,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
        starts_at: toApiDateTime(form.starts_at),
        due_at: toApiDateTime(form.due_at),
        status: form.status,
        completion_percent: Number(form.completion_percent || 0),
        assigned_to: Number(form.assigned_to),
        notes: form.notes.trim() || null,
      }
      if (editing) {
        await adminApi.training.update(editing.id, payload)
        toast({ title: 'Training updated', variant: 'success' })
      } else {
        await adminApi.training.create(payload)
        toast({ title: 'Training assigned', variant: 'success' })
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
      await adminApi.training.delete(deleteTarget.id)
      toast({ title: 'Training deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<TrainingRow>[] = useMemo(() => [
    {
      key: 'title',
      header: 'Training',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-[var(--muted-foreground)] capitalize">
            {row.category.replace(/_/g, ' ')} · {row.mode.replace(/_/g, ' ')}
          </p>
        </div>
      ),
    },
    {
      key: 'assigned_name',
      header: 'Employee',
      render: (row) => row.assigned_name || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <Badge variant={statusVariant(row.status)} className="capitalize">{row.status.replace(/_/g, ' ')}</Badge>
          <p className="text-xs text-[var(--muted-foreground)]">{row.completion_percent}%</p>
        </div>
      ),
    },
    {
      key: 'due_at',
      header: 'Due',
      render: (row) => (row.due_at ? formatDate(row.due_at) : '—'),
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
        eyebrow="Learning"
        heroTitle="Training"
        heroDescription="Assign courses and track completion across the team."
        title="Manage training"
        description="Create assignments and monitor progress"
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
              Assign training
            </Button>
          </div>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['title', 'assigned_name', 'category', 'provider', 'status']}
          searchPlaceholder="Search training..."
          emptyTitle="No training assigned"
          emptyDescription="Assign the first course to an employee."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {editing ? 'Edit training' : 'Assign training'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Employee *</Label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                rows={3}
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
                <Label>Mode</Label>
                <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Input type="number" min={0} value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Due at</Label>
                <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="h-11 rounded-xl" />
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
                <Label>Progress %</Label>
                <Input type="number" min={0} max={100} value={form.completion_percent} onChange={(e) => setForm({ ...form, completion_percent: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="button" className="rounded-xl" disabled={saving || !form.title.trim() || !form.assigned_to} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete training?"
        description={deleteTarget ? `Remove “${deleteTarget.title}” for ${deleteTarget.assigned_name || 'employee'}?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
