import { useCallback, useEffect, useMemo, useState } from 'react'
import { Laptop, Pencil, Plus, Trash2 } from 'lucide-react'
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

type AssetRow = {
  id: string
  asset_tag: string
  name: string
  category: string
  brand: string
  model: string
  serial_number: string
  status: string
  condition: string
  notes: string
  purchased_at: string
  assigned_to: string
  assigned_name: string
  assigned_at: string
}

const CATEGORIES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'id_card', label: 'ID card' },
  { value: 'access_card', label: 'Access card' },
  { value: 'peripheral', label: 'Peripheral' },
  { value: 'other', label: 'Other' },
] as const

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
] as const

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const

const emptyForm = {
  asset_tag: '',
  name: '',
  category: 'laptop',
  brand: '',
  model: '',
  serial_number: '',
  status: 'available',
  condition: 'good',
  notes: '',
  purchased_at: '',
  assigned_to: '',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'assigned') return 'default'
  if (status === 'maintenance') return 'secondary'
  if (status === 'retired') return 'destructive'
  return 'outline'
}

function mapRow(raw: unknown): AssetRow {
  const item = asRecord(raw)
  const assignee = asRecord(item.assignee)
  return {
    id: asString(item.id),
    asset_tag: asString(item.asset_tag),
    name: asString(item.name),
    category: asString(item.category) || 'other',
    brand: asString(item.brand),
    model: asString(item.model),
    serial_number: asString(item.serial_number),
    status: asString(item.status) || 'available',
    condition: asString(item.condition) || 'good',
    notes: asString(item.notes),
    purchased_at: asString(item.purchased_at),
    assigned_to: asString(item.assigned_to),
    assigned_name: asString(assignee.full_name),
    assigned_at: asString(item.assigned_at),
  }
}

export default function AssetsManagement() {
  const [items, setItems] = useState<AssetRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AssetRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AssetRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadEmployees = useCallback(async () => {
    try {
      const raw = asRecord(await adminApi.employees.list({ status: 'active' }))
      setEmployees(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        const name = asString(row.full_name) || asString(row.name)
        const code = asString(row.employee_code)
        return {
          id: asString(row.id),
          label: code ? `${name} (${code})` : name,
        }
      }).filter((e) => e.id && e.label))
    } catch {
      setEmployees([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = asRecord(await adminApi.assets.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }))
      setItems(unwrapList(raw.data ?? raw).map(mapRow))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: AssetRow) => {
    setEditing(row)
    setForm({
      asset_tag: row.asset_tag,
      name: row.name,
      category: row.category,
      brand: row.brand,
      model: row.model,
      serial_number: row.serial_number,
      status: row.status,
      condition: row.condition,
      notes: row.notes,
      purchased_at: row.purchased_at ? row.purchased_at.slice(0, 10) : '',
      assigned_to: row.assigned_to,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.asset_tag.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        asset_tag: form.asset_tag.trim(),
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        serial_number: form.serial_number.trim() || null,
        status: form.status,
        condition: form.condition,
        notes: form.notes.trim() || null,
        purchased_at: form.purchased_at || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      }
      if (editing) {
        await adminApi.assets.update(editing.id, payload)
        toast({ title: 'Asset updated', variant: 'success' })
      } else {
        await adminApi.assets.create(payload)
        toast({ title: 'Asset created', variant: 'success' })
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
      await adminApi.assets.delete(deleteTarget.id)
      toast({ title: 'Asset deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<AssetRow>[] = useMemo(() => [
    {
      key: 'asset_tag',
      header: 'Asset',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{row.asset_tag}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="capitalize">{row.category.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status)} className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'assigned_name',
      header: 'Assigned to',
      render: (row) => row.assigned_name || '—',
    },
    {
      key: 'condition',
      header: 'Condition',
      render: (row) => <span className="capitalize">{row.condition}</span>,
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
        eyebrow="Inventory"
        heroTitle="Company assets"
        heroDescription="Track laptops, phones, and other company equipment. Assign items to employees."
        title="Manage assets"
        description="Create assets and assign them to staff"
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
              Add asset
            </Button>
          </div>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['asset_tag', 'name', 'category', 'serial_number', 'assigned_name', 'brand', 'model']}
          searchPlaceholder="Search assets..."
          emptyTitle="No assets"
          emptyDescription="Add the first company asset to start tracking inventory."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              {editing ? 'Edit asset' : 'Add asset'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Asset tag *</Label>
                <Input
                  value={form.asset_tag}
                  onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
                  placeholder="SK-LAP-001"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="MacBook Pro 14"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Serial number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="h-11 rounded-xl" />
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
                <Label>Condition</Label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assigned to</Label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({
                    ...form,
                    assigned_to: e.target.value,
                    status: e.target.value && form.status === 'available' ? 'assigned' : form.status,
                  })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Purchased on</Label>
                <Input
                  type="date"
                  value={form.purchased_at}
                  onChange={(e) => setForm({ ...form, purchased_at: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            {editing?.assigned_at ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Assigned {formatDate(editing.assigned_at)}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.asset_tag.trim() || !form.name.trim()}
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
        title="Delete asset?"
        description={deleteTarget ? `Remove “${deleteTarget.name}” (${deleteTarget.asset_tag})?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
