import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, MenuSquare } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable, type Column } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminApi } from '@/services/api'
import { asRecord, asString, asNumber, asBool, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { actionBtn } from '@/lib/tableActions'
import { toast } from '@/components/ui/toaster'

type PortalMenuRow = {
  id: string
  key: string
  label: string
  route: string
  icon: string
  sort_order: number
  permission: string
  is_active: boolean
  badge_enabled: boolean
  portal: string
}

type MenuForm = {
  key: string
  label: string
  route: string
  icon: string
  sort_order: number
  permission: string
  is_active: boolean
  badge_enabled: boolean
}

const emptyForm: MenuForm = {
  key: '',
  label: '',
  route: '/employee/',
  icon: '',
  sort_order: 0,
  permission: '',
  is_active: true,
  badge_enabled: false,
}

function mapMenu(raw: unknown): PortalMenuRow {
  const item = asRecord(raw)
  return {
    id: asString(item.id),
    key: asString(item.key),
    label: asString(item.label),
    route: asString(item.route),
    icon: asString(item.icon),
    sort_order: asNumber(item.sort_order),
    permission: asString(item.permission),
    is_active: item.is_active === undefined ? true : asBool(item.is_active),
    badge_enabled: asBool(item.badge_enabled),
    portal: asString(item.portal) || 'employee',
  }
}

export default function PortalMenusPage() {
  const [items, setItems] = useState<PortalMenuRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PortalMenuRow | null>(null)
  const [form, setForm] = useState<MenuForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PortalMenuRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = unwrapList(await adminApi.portalMenus.list({ portal: 'employee' })).map(mapMenu)
      setItems(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      sort_order: (items[items.length - 1]?.sort_order ?? 0) + 10,
    })
    setFormOpen(true)
  }

  const openEdit = (row: PortalMenuRow) => {
    setEditing(row)
    setForm({
      key: row.key,
      label: row.label,
      route: row.route,
      icon: row.icon,
      sort_order: row.sort_order,
      permission: row.permission,
      is_active: row.is_active,
      badge_enabled: row.badge_enabled,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        portal: 'employee',
        key: form.key.trim(),
        label: form.label.trim(),
        route: form.route.trim(),
        icon: form.icon.trim() || null,
        sort_order: form.sort_order,
        permission: form.permission.trim() || null,
        is_active: form.is_active,
        badge_enabled: form.badge_enabled,
      }
      if (editing) {
        await adminApi.portalMenus.update(editing.id, payload)
        toast({ title: 'Menu updated' })
      } else {
        await adminApi.portalMenus.create(payload)
        toast({ title: 'Menu created' })
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
      await adminApi.portalMenus.delete(deleteTarget.id)
      toast({ title: 'Menu deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<PortalMenuRow>[] = useMemo(() => [
    {
      key: 'label',
      header: 'Menu',
      render: (row) => (
        <div>
          <p className="font-medium">{row.label}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{row.key}</p>
        </div>
      ),
    },
    { key: 'route', header: 'Route' },
    {
      key: 'permission',
      header: 'Permission',
      render: (row) => row.permission || '—',
    },
    {
      key: 'sort_order',
      header: 'Order',
      className: 'w-20',
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
        eyebrow="Access control"
        heroTitle="Portal menus"
        heroDescription="Employee portal menu catalog — assign these to company roles."
        title="Employee portal menus"
        description="Create, edit, and reorder sidebar menus for /employee"
        loading={loading}
        error={error}
        actions={(
          <Button className="rounded-xl glow-btn" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add menu
          </Button>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['label', 'key', 'route']}
          searchPlaceholder="Search menus..."
          emptyTitle="No portal menus"
          emptyDescription="Seed the catalog or add a menu manually."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MenuSquare className="h-5 w-5" />
              {editing ? 'Edit portal menu' : 'Add portal menu'}
            </DialogTitle>
            <DialogDescription>
              Menus appear in the employee sidebar when enabled for a company role.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pm-key">Key</Label>
              <Input
                id="pm-key"
                value={form.key}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="tasks"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-label">Label</Label>
              <Input
                id="pm-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="My Tasks"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-route">Route</Label>
              <Input
                id="pm-route"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                placeholder="/employee/tasks"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pm-icon">Icon</Label>
                <Input
                  id="pm-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="ListTodo"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pm-sort">Sort order</Label>
                <Input
                  id="pm-sort"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-permission">Permission</Label>
              <Input
                id="pm-permission"
                value={form.permission}
                onChange={(e) => setForm({ ...form, permission: e.target.value })}
                placeholder="employee.tasks.view"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-[var(--muted-foreground)]">Inactive menus are hidden from role assignment.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium">Badge enabled</p>
                <p className="text-xs text-[var(--muted-foreground)]">Allow unread/count badges on this menu.</p>
              </div>
              <Switch checked={form.badge_enabled} onCheckedChange={(v) => setForm({ ...form, badge_enabled: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.key.trim() || !form.label.trim() || !form.route.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete portal menu?"
        description={deleteTarget ? `Remove “${deleteTarget.label}” from the catalog? Roles using it will lose this menu.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
