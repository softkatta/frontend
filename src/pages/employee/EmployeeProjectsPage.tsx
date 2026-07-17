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

type ProjectRow = {
  id: string
  name: string
  description: string
  status: string
  role: string
  progress: number
  start_date: string
  end_date: string
}

const STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
  role: '',
  progress: 0,
  start_date: '',
  end_date: '',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'completed') return 'default'
  if (status === 'active') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  if (status === 'on_hold') return 'outline'
  return 'outline'
}

export default function EmployeeProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.projects.list({ status: statusFilter }))
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          name: asString(row.name),
          description: asString(row.description),
          status: asString(row.status) || 'active',
          role: asString(row.role),
          progress: Number(row.progress ?? 0),
          start_date: asString(row.start_date),
          end_date: asString(row.end_date),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load projects', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: ProjectRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description,
      status: row.status,
      role: row.role,
      progress: row.progress,
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        role: form.role.trim() || undefined,
        progress: Number(form.progress) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      if (editing) {
        await employeeApi.projects.update(editing.id, payload)
        toast({ title: 'Project updated', variant: 'success' })
      } else {
        await employeeApi.projects.create(payload)
        toast({ title: 'Project created', variant: 'success' })
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
      await employeeApi.projects.delete(deleteTarget.id)
      toast({ title: 'Project deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const stats = useMemo(() => ({
    active: rows.filter((r) => r.status === 'active').length,
    completed: rows.filter((r) => r.status === 'completed').length,
    avgProgress: rows.length
      ? Math.round(rows.reduce((sum, r) => sum + r.progress, 0) / rows.length)
      : 0,
  }), [rows])

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Work"
        title="My Projects"
        description="Track projects you are assigned to or owning."
        aside={(
          <Button className="rounded-xl glow-btn" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        )}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Active</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Completed</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Avg progress</p>
          <p className="mt-1 font-display text-2xl font-bold">{stats.avgProgress}%</p>
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
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <DataTable
              embedded
              data={rows}
              emptyTitle="No projects yet"
              emptyDescription="Add a project you are working on."
              searchKeys={['name', 'description', 'role', 'status']}
              searchPlaceholder="Search projects..."
              pageSize={10}
              columns={[
                {
                  key: 'name',
                  header: 'Project',
                  render: (row) => (
                    <div className="min-w-0">
                      <p className="font-medium">{row.name}</p>
                      {row.role ? (
                        <p className="text-xs text-[var(--muted-foreground)]">{row.role}</p>
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
                  key: 'progress',
                  header: 'Progress',
                  render: (row) => (
                    <div className="min-w-[100px]">
                      <div className="mb-1 text-xs font-medium">{row.progress}%</div>
                      <div className="h-1.5 rounded-full bg-[var(--input)]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--brand-teal)]"
                          style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'dates',
                  header: 'Timeline',
                  render: (row) => {
                    if (!row.start_date && !row.end_date) return '—'
                    return `${row.start_date ? formatDate(row.start_date) : '…'} – ${row.end_date ? formatDate(row.end_date) : '…'}`
                  },
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
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit project' : 'Add project'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name *</Label>
              <Input
                id="project-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Client portal redesign"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <textarea
                id="project-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="project-role">Your role</Label>
                <Input
                  id="project-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Developer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-progress">Progress ({form.progress}%)</Label>
              <Input
                id="project-progress"
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) || 0 })}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="project-start">Start date</Label>
                <Input
                  id="project-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-end">End date</Label>
                <Input
                  id="project-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.name.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete project?"
        description={deleteTarget ? `Remove “${deleteTarget.name}”? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </PortalPage>
  )
}
