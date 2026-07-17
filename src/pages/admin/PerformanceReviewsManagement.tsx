import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'
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

type ReviewRow = {
  id: string
  employee_id: string
  employee_name: string
  cycle_label: string
  period_start: string
  period_end: string
  reviewer_name: string
  overall_rating: string
  score: string
  strengths: string
  improvements: string
  goals: string
  manager_comments: string
  employee_comments: string
  status: string
  shared_at: string
  acknowledged_at: string
}

const RATINGS = [
  { value: 'exceeds', label: 'Exceeds expectations' },
  { value: 'meets', label: 'Meets expectations' },
  { value: 'partially_meets', label: 'Partially meets' },
  { value: 'needs_improvement', label: 'Needs improvement' },
] as const

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'shared', label: 'Shared with employee' },
  { value: 'acknowledged', label: 'Acknowledged' },
] as const

const emptyForm = {
  employee_id: '',
  cycle_label: '',
  period_start: '',
  period_end: '',
  reviewer_name: '',
  overall_rating: 'meets',
  score: '',
  strengths: '',
  improvements: '',
  goals: '',
  manager_comments: '',
  status: 'draft',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'acknowledged') return 'default'
  if (status === 'shared') return 'secondary'
  return 'outline'
}

function ratingLabel(value: string) {
  return RATINGS.find((r) => r.value === value)?.label ?? value.replace(/_/g, ' ')
}

function mapRow(raw: unknown): ReviewRow {
  const item = asRecord(raw)
  const employee = asRecord(item.employee)
  return {
    id: asString(item.id),
    employee_id: asString(item.employee_id),
    employee_name: asString(employee.full_name),
    cycle_label: asString(item.cycle_label),
    period_start: asString(item.period_start),
    period_end: asString(item.period_end),
    reviewer_name: asString(item.reviewer_name),
    overall_rating: asString(item.overall_rating) || 'meets',
    score: asString(item.score),
    strengths: asString(item.strengths),
    improvements: asString(item.improvements),
    goals: asString(item.goals),
    manager_comments: asString(item.manager_comments),
    employee_comments: asString(item.employee_comments),
    status: asString(item.status) || 'draft',
    shared_at: asString(item.shared_at),
    acknowledged_at: asString(item.acknowledged_at),
  }
}

export default function PerformanceReviewsManagement() {
  const [items, setItems] = useState<ReviewRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ReviewRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null)
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
      const raw = asRecord(await adminApi.performance.list({
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

  const openEdit = (row: ReviewRow) => {
    setEditing(row)
    setForm({
      employee_id: row.employee_id,
      cycle_label: row.cycle_label,
      period_start: row.period_start ? row.period_start.slice(0, 10) : '',
      period_end: row.period_end ? row.period_end.slice(0, 10) : '',
      reviewer_name: row.reviewer_name,
      overall_rating: row.overall_rating,
      score: row.score,
      strengths: row.strengths,
      improvements: row.improvements,
      goals: row.goals,
      manager_comments: row.manager_comments,
      status: row.status,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.employee_id || !form.cycle_label.trim()) return
    setSaving(true)
    try {
      const payload = {
        employee_id: Number(form.employee_id),
        cycle_label: form.cycle_label.trim(),
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        reviewer_name: form.reviewer_name.trim() || null,
        overall_rating: form.overall_rating,
        score: form.score ? Number(form.score) : null,
        strengths: form.strengths.trim() || null,
        improvements: form.improvements.trim() || null,
        goals: form.goals.trim() || null,
        manager_comments: form.manager_comments.trim() || null,
        status: form.status,
      }
      if (editing) {
        await adminApi.performance.update(editing.id, payload)
        toast({ title: 'Review updated', variant: 'success' })
      } else {
        await adminApi.performance.create(payload)
        toast({ title: 'Review created', variant: 'success' })
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
      await adminApi.performance.delete(deleteTarget.id)
      toast({ title: 'Review deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<ReviewRow>[] = useMemo(() => [
    {
      key: 'cycle_label',
      header: 'Review',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.cycle_label}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{row.employee_name || '—'}</p>
        </div>
      ),
    },
    {
      key: 'overall_rating',
      header: 'Rating',
      render: (row) => (
        <div>
          <p className="text-sm">{ratingLabel(row.overall_rating)}</p>
          {row.score ? <p className="text-xs text-[var(--muted-foreground)]">Score {row.score}/5</p> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status)} className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'period_end',
      header: 'Period',
      render: (row) => {
        if (!row.period_start && !row.period_end) return '—'
        return `${row.period_start ? formatDate(row.period_start) : '…'} – ${row.period_end ? formatDate(row.period_end) : '…'}`
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
  ], [])

  return (
    <>
      <PortalPageShell
        eyebrow="People development"
        heroTitle="Performance reviews"
        heroDescription="Create review cycles, share with employees, and track acknowledgements."
        title="Manage reviews"
        description="Draft, share, and follow up on performance feedback"
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
              New review
            </Button>
          </div>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['cycle_label', 'employee_name', 'reviewer_name', 'overall_rating', 'status']}
          searchPlaceholder="Search reviews..."
          emptyTitle="No reviews yet"
          emptyDescription="Create the first performance review."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {editing ? 'Edit review' : 'New review'}
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
              <Label>Cycle label *</Label>
              <Input
                value={form.cycle_label}
                onChange={(e) => setForm({ ...form, cycle_label: e.target.value })}
                placeholder="Q1 2026 / Annual 2026"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Period start</Label>
                <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Period end</Label>
                <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Reviewer</Label>
                <Input value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Score (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Overall rating</Label>
                <select value={form.overall_rating} onChange={(e) => setForm({ ...form, overall_rating: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <p className="text-xs text-[var(--muted-foreground)]">Set to Shared so the employee can see it</p>
              </div>
            </div>
            {(['strengths', 'improvements', 'goals', 'manager_comments'] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize">{field.replace(/_/g, ' ')}</Label>
                <textarea
                  rows={2}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
              </div>
            ))}
            {editing?.employee_comments ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-3 text-sm">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Employee comments</p>
                <p className="mt-1 whitespace-pre-wrap">{editing.employee_comments}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="button" className="rounded-xl" disabled={saving || !form.employee_id || !form.cycle_label.trim()} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete review?"
        description={deleteTarget ? `Remove “${deleteTarget.cycle_label}” for ${deleteTarget.employee_name || 'employee'}?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
