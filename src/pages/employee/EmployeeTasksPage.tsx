import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TableActions } from '@/components/common/TableActions'
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
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type TaskRow = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
}

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

const emptyForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'done') return 'default'
  if (status === 'in_progress') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function priorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (priority === 'high') return 'destructive'
  if (priority === 'medium') return 'secondary'
  return 'outline'
}

export default function EmployeeTasksPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<TaskRow[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TaskRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TaskRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.tasks.list({
        status: statusFilter,
        priority: priorityFilter,
      }))
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          title: asString(row.title),
          description: asString(row.description),
          status: asString(row.status) || 'todo',
          priority: asString(row.priority) || 'medium',
          due_date: asString(row.due_date),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load tasks', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: TaskRow) => {
    setEditing(row)
    setForm({
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date ? row.due_date.slice(0, 10) : '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
      }
      if (editing) {
        await employeeApi.tasks.update(editing.id, payload)
        toast({ title: 'Task updated', variant: 'success' })
      } else {
        await employeeApi.tasks.create(payload)
        toast({ title: 'Task created', variant: 'success' })
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
      await employeeApi.tasks.delete(deleteTarget.id)
      toast({ title: 'Task deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const stats = useMemo(() => ({
    open: rows.filter((r) => r.status === 'todo' || r.status === 'in_progress').length,
    done: rows.filter((r) => r.status === 'done').length,
    high: rows.filter((r) => r.priority === 'high' && r.status !== 'done' && r.status !== 'cancelled').length,
  }), [rows])

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Work"
        title="My Tasks"
        description="Create and track your personal work items."
        aside={(
          <Button className="rounded-xl glow-btn" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Open</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Done</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.done}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">High priority</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.high}</p>
        </div>
      </div>

      <PortalPanel>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <DataTable
              embedded
              data={rows}
              emptyTitle="No tasks yet"
              emptyDescription="Add your first task to start tracking work."
              searchKeys={['title', 'description', 'status', 'priority']}
              searchPlaceholder="Search tasks..."
              pageSize={10}
              columns={[
                {
                  key: 'title',
                  header: 'Task',
                  render: (row) => (
                    <div className="min-w-0">
                      <p className="font-medium">{row.title}</p>
                      {row.description ? (
                        <p className="truncate text-xs text-[var(--muted-foreground)] max-w-xs">{row.description}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge variant={statusVariant(row.status)} className="capitalize">
                      {row.status.replace('_', ' ')}
                    </Badge>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (row) => (
                    <Badge variant={priorityVariant(row.priority)} className="capitalize">
                      {row.priority}
                    </Badge>
                  ),
                },
                {
                  key: 'due_date',
                  header: 'Due',
                  render: (row) => (row.due_date ? formatDate(row.due_date) : '—'),
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
              ]}
            />
          )}
        </div>
      </PortalPanel>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit task' : 'Add task'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Prepare weekly status update"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <textarea
                id="task-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.title.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete task?"
        description={deleteTarget ? `Remove “${deleteTarget.title}”? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </PortalPage>
  )
}
