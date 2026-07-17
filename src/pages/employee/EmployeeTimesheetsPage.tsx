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

type TimesheetRow = {
  id: string
  work_date: string
  hours: number
  project_label: string
  employee_project_id: string
  status: string
  notes: string
}

type ProjectOption = { id: string; name: string }

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
] as const

const emptyForm = {
  work_date: '',
  hours: '8',
  project_label: '',
  employee_project_id: '',
  status: 'submitted',
  notes: '',
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'approved') return 'default'
  if (status === 'submitted') return 'secondary'
  if (status === 'rejected') return 'destructive'
  return 'outline'
}

export default function EmployeeTimesheetsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<TimesheetRow[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [month, setMonth] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TimesheetRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TimesheetRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProjects = useCallback(async () => {
    try {
      const raw = asRecord(await employeeApi.projects.list())
      setProjects(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return { id: asString(row.id), name: asString(row.name) }
      }))
    } catch {
      setProjects([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.timesheets.list({ month, status: statusFilter }))
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        const project = asRecord(row.project)
        return {
          id: asString(row.id),
          work_date: asString(row.work_date),
          hours: Number(row.hours ?? 0),
          project_label: asString(row.project_label) || asString(project.name),
          employee_project_id: asString(row.employee_project_id),
          status: asString(row.status) || 'submitted',
          notes: asString(row.notes),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load timesheets', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [month, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      work_date: new Date().toISOString().slice(0, 10),
    })
    setFormOpen(true)
  }

  const openEdit = (row: TimesheetRow) => {
    setEditing(row)
    setForm({
      work_date: row.work_date ? row.work_date.slice(0, 10) : '',
      hours: String(row.hours || 0),
      project_label: row.project_label,
      employee_project_id: row.employee_project_id,
      status: row.status === 'draft' || row.status === 'submitted' ? row.status : 'submitted',
      notes: row.notes,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.work_date || !form.hours) return
    setSaving(true)
    try {
      const payload = {
        work_date: form.work_date,
        hours: Number(form.hours),
        project_label: form.project_label.trim() || undefined,
        employee_project_id: form.employee_project_id ? Number(form.employee_project_id) : null,
        status: form.status,
        notes: form.notes.trim() || undefined,
      }
      if (editing) {
        await employeeApi.timesheets.update(editing.id, payload)
        toast({ title: 'Timesheet updated', variant: 'success' })
      } else {
        await employeeApi.timesheets.create(payload)
        toast({ title: 'Timesheet logged', variant: 'success' })
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
      await employeeApi.timesheets.delete(deleteTarget.id)
      toast({ title: 'Timesheet deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + (Number.isFinite(row.hours) ? row.hours : 0), 0),
    [rows],
  )

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Work"
        title="Timesheets"
        description="Log daily hours against your work and projects."
        aside={(
          <Button className="rounded-xl glow-btn" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Log hours
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Entries</p>
          <p className="mt-1 font-display text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Total hours</p>
          <p className="mt-1 font-display text-2xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
      </div>

      <PortalPanel>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 w-full rounded-xl sm:w-48"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <DataTable
              embedded
              data={rows}
              emptyTitle="No timesheet entries"
              emptyDescription="Log hours for this month to get started."
              searchKeys={['project_label', 'notes', 'status']}
              searchPlaceholder="Search entries..."
              pageSize={15}
              columns={[
                {
                  key: 'work_date',
                  header: 'Date',
                  render: (row) => formatDate(row.work_date),
                },
                {
                  key: 'hours',
                  header: 'Hours',
                  render: (row) => row.hours.toFixed(2),
                },
                {
                  key: 'project_label',
                  header: 'Project / work',
                  render: (row) => row.project_label || '—',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge variant={statusVariant(row.status)} className="capitalize">
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  key: 'notes',
                  header: 'Notes',
                  className: 'max-w-[180px] truncate',
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'w-28',
                  render: (row) => {
                    const locked = row.status === 'approved' || row.status === 'rejected'
                    return (
                      <TableActions
                        actions={[
                          { ...actionBtn('Edit', Pencil, () => openEdit(row)), hidden: locked },
                          {
                            ...actionBtn('Delete', Trash2, () => setDeleteTarget(row)),
                            variant: 'destructive',
                            hidden: locked,
                          },
                        ]}
                      />
                    )
                  },
                },
              ]}
            />
          )}
        </div>
      </PortalPanel>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit timesheet' : 'Log hours'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ts-date">Work date *</Label>
                <Input
                  id="ts-date"
                  type="date"
                  value={form.work_date}
                  onChange={(e) => setForm({ ...form, work_date: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ts-hours">Hours *</Label>
                <Input
                  id="ts-hours"
                  type="number"
                  min={0.25}
                  max={24}
                  step={0.25}
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link project (optional)</Label>
              <select
                value={form.employee_project_id}
                onChange={(e) => {
                  const id = e.target.value
                  const project = projects.find((p) => p.id === id)
                  setForm({
                    ...form,
                    employee_project_id: id,
                    project_label: project?.name || form.project_label,
                  })
                }}
                className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
              >
                <option value="">No linked project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ts-label">Project / work label</Label>
              <Input
                id="ts-label"
                value={form.project_label}
                onChange={(e) => setForm({ ...form, project_label: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Feature development"
              />
            </div>
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
              <Label htmlFor="ts-notes">Notes</Label>
              <textarea
                id="ts-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
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
              disabled={saving || !form.work_date || !form.hours}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Log hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete timesheet entry?"
        description={deleteTarget ? `Remove entry for ${formatDate(deleteTarget.work_date)} (${deleteTarget.hours}h)?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </PortalPage>
  )
}
