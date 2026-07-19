import { useCallback, useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminTenant } from '@/lib/apiMappers'
import { slugify } from '@/lib/slug'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type TenantRow = ReturnType<typeof mapAdminTenant>
type CustomerOption = { id: string; label: string }

type TenantFormValues = {
  name: string
  slug: string
  owner_id: string
  backend_domain: string
  frontend_domain: string
  status: 'active' | 'suspended' | 'inactive'
}

const EMPTY_FORM: TenantFormValues = {
  name: '',
  slug: '',
  owner_id: '',
  backend_domain: '',
  frontend_domain: '',
  status: 'active',
}

function TenantFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: TenantFormValues | null
  saving?: boolean
  onSubmit: (values: TenantFormValues) => void | Promise<void>
}) {
  const [form, setForm] = useState<TenantFormValues>(initial ?? EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const isEdit = Boolean(initial)

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM)
    setAutoSlug(!Boolean(initial?.slug))
  }, [initial, open])

  useEffect(() => {
    if (!open) return
    void adminApi.users.list({ role: 'client', per_page: 200 }).then((res) => {
      setCustomers(
        unwrapList(res).map((row) => {
          const user = asRecord(row)
          const name = asString(user.name, 'Customer')
          const email = asString(user.email)
          return { id: asString(user.id), label: email ? `${name} (${email})` : name }
        }),
      )
    }).catch(() => setCustomers([]))
  }, [open])

  const update = (patch: Partial<TenantFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.name !== undefined) {
        next.slug = slugify(patch.name)
      }
      return next
    })
  }

  const canSubmit = form.name.trim() && form.owner_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit tenant' : 'Add tenant'}</DialogTitle>
          <DialogDescription>
            Link a customer and assign frontend/backend domains. License generation and project install only work on these domains.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSubmit) return
            void onSubmit({
              ...form,
              name: form.name.trim(),
              slug: form.slug.trim(),
              backend_domain: form.backend_domain.trim(),
              frontend_domain: form.frontend_domain.trim(),
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="tenant-customer">Customer *</Label>
            <Select
              value={form.owner_id || undefined}
              onValueChange={(value) => update({ owner_id: value })}
            >
              <SelectTrigger id="tenant-customer" className="bg-[var(--input-background)]">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-name">Name *</Label>
            <Input
              id="tenant-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Acme Workspace"
              required
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Slug</Label>
              <Input
                id="tenant-slug"
                value={form.slug}
                onChange={(event) => {
                  setAutoSlug(false)
                  update({ slug: event.target.value })
                }}
                placeholder="acme-workspace"
                className="bg-[var(--input-background)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-status">Status</Label>
              <select
                id="tenant-status"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TenantFormValues['status'] }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-backend-domain">Backend Domain *</Label>
              <Input
                id="tenant-backend-domain"
                value={form.backend_domain}
                onChange={(event) => setForm((prev) => ({ ...prev, backend_domain: event.target.value }))}
                placeholder="api.acme.softkatta.in"
                className="bg-[var(--input-background)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-frontend-domain">Frontend Domain *</Label>
              <Input
                id="tenant-frontend-domain"
                value={form.frontend_domain}
                onChange={(event) => setForm((prev) => ({ ...prev, frontend_domain: event.target.value }))}
                placeholder="app.acme.softkatta.in"
                className="bg-[var(--input-background)]"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Install wizard will only complete if the detected domain matches one of these SoftKatta Admin domains.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TenantsManagement() {
  const fetcher = useCallback(() => adminApi.tenants.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminTenant), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const [detail, setDetail] = useState<TenantRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null)

  const openCreate = () => {
    setEditingTenant(null)
    setFormOpen(true)
  }

  const openEdit = (tenant: TenantRow) => {
    setEditingTenant(tenant)
    setFormOpen(true)
  }

  const handleSave = async (values: TenantFormValues) => {
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        owner_id: Number(values.owner_id) || values.owner_id,
        backend_domain: values.backend_domain || null,
        frontend_domain: values.frontend_domain || null,
        status: values.status,
      }

      if (editingTenant) {
        await adminApi.tenants.update(editingTenant.id, payload)
        toast({ title: 'Tenant updated', description: values.name, variant: 'success' })
      } else {
        await adminApi.tenants.create(payload)
        toast({ title: 'Tenant created', description: values.name, variant: 'success' })
      }

      setFormOpen(false)
      setEditingTenant(null)
      await reload()
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
      await adminApi.tenants.delete(deleteTarget.id)
      toast({ title: 'Tenant deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) {
        setDetail(null)
      }
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Workspace"
        heroTitle="Tenants"
        heroDescription="Assign customers and domains. Licenses and installs only work on the domains saved here."
        title="Tenants"
        description="Create and manage platform workspaces"
        actions={
          <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> Add Tenant
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'slug', 'backend_domain', 'frontend_domain', 'owner_name', 'owner_email']}
          searchPlaceholder="Search tenants..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'name', header: 'Tenant', className: 'font-medium' },
            { key: 'slug', header: 'Slug' },
            {
              key: 'owner_name',
              header: 'Customer',
              render: (tenant) => tenant.owner_name || tenant.owner_email || '—',
            },
            { key: 'backend_domain', header: 'Backend Domain', render: (tenant) => tenant.backend_domain || '—' },
            { key: 'frontend_domain', header: 'Frontend Domain', render: (tenant) => tenant.frontend_domain || '—' },
            {
              key: 'status',
              header: 'Status',
              render: (tenant) => {
                if (tenant.status === 'active') {
                  return <Badge variant="success">Active</Badge>
                }
                if (tenant.status === 'suspended') {
                  return <Badge variant="warning">Suspended</Badge>
                }
                return <Badge variant="secondary">Inactive</Badge>
              },
            },
            { key: 'created_at', header: 'Created', render: (tenant) => formatDate(tenant.created_at) },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[120px] text-right',
              render: (tenant) => (
                <TableActions actions={[
                  actionBtn('View tenant', Eye, () => setDetail(tenant)),
                  actionBtn('Edit tenant', Pencil, () => openEdit(tenant)),
                  { ...actionBtn('Delete tenant', Trash2, () => setDeleteTarget(tenant)), variant: 'destructive' },
                ]} />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Tenant details">
        {detail && (
          <>
            <DetailRow label="Tenant" value={detail.name} />
            <DetailRow label="Slug" value={detail.slug || '—'} />
            <DetailRow label="Customer" value={detail.owner_name || detail.owner_email || '—'} />
            <DetailRow label="Customer Email" value={detail.owner_email || '—'} />
            <DetailRow label="Backend Domain" value={detail.backend_domain || '—'} />
            <DetailRow label="Frontend Domain" value={detail.frontend_domain || '—'} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Created" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>

      <TenantFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingTenant(null)
          }
        }}
        initial={editingTenant ? {
          name: editingTenant.name,
          slug: editingTenant.slug,
          owner_id: editingTenant.owner_id,
          backend_domain: editingTenant.backend_domain,
          frontend_domain: editingTenant.frontend_domain,
          status: editingTenant.status as TenantFormValues['status'],
        } : null}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete tenant?"
        description={deleteTarget ? `This will permanently remove ${deleteTarget.name}.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
