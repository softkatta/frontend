import { useCallback, useState } from 'react'
import { Eye, Pencil, Plus, Trash2, UserX } from 'lucide-react'
import { CustomerFormDialog, type CustomerFormValues } from '@/components/admin/CustomerFormDialog'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminCustomer } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type CustomerRow = ReturnType<typeof mapAdminCustomer>

export default function CustomersPage() {
  const fetcher = useCallback(() => adminApi.users.list({ role: 'client' }), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminCustomer), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<CustomerRow | null>(null)
  const [editing, setEditing] = useState<CustomerRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleActive = async (customer: CustomerRow) => {
    try {
      await adminApi.users.update(customer.id, { is_active: !customer.is_active })
      toast({ title: customer.is_active ? 'Customer deactivated' : 'Customer activated', variant: 'success' })
      await reload()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleCreate = async (values: CustomerFormValues) => {
    setSaving(true)
    try {
      await adminApi.users.create({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || null,
        company_name: values.company_name || null,
        is_active: values.is_active,
      })
      toast({ title: 'Customer created', description: values.name, variant: 'success' })
      setCreating(false)
      await reload()
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (values: CustomerFormValues) => {
    if (!editing) return
    setSaving(true)
    try {
      await adminApi.users.update(editing.id, {
        name: values.name,
        email: values.email,
        company_name: values.company_name || null,
        is_active: values.is_active,
      })
      toast({ title: 'Customer updated', description: values.name, variant: 'success' })
      setEditing(null)
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
      await adminApi.users.delete(deleteTarget.id)
      toast({ title: 'Customer deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) setDetail(null)
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
        eyebrow="Users"
        heroTitle="Customers"
        heroDescription="View and manage registered customer accounts across the platform."
        title="Customers"
        description="Manage all registered customers"
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'email', 'company']}
          searchPlaceholder="Search customers..."
          filters={[
            { key: 'is_active', label: 'Status', options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'name', header: 'Name', className: 'font-medium' },
            { key: 'email', header: 'Email' },
            { key: 'company', header: 'Company' },
            { key: 'is_active', header: 'Status', render: (c) => <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'created_at', header: 'Joined', render: (c) => formatDate(c.created_at) },
            { key: 'actions', header: 'Actions', className: 'w-[130px] text-right', render: (c) => (
              <TableActions actions={[
                actionBtn('View customer', Eye, () => setDetail(c)),
                actionBtn('Edit customer', Pencil, () => setEditing(c)),
                actionBtn(c.is_active ? 'Deactivate' : 'Activate', UserX, () => void toggleActive(c)),
                { ...actionBtn('Delete customer', Trash2, () => setDeleteTarget(c)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Customer details">
        {detail && (
          <>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Company" value={detail.company || '—'} />
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
            <DetailRow label="Joined" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>

      <CustomerFormDialog
        open={creating}
        mode="create"
        onOpenChange={(open) => !open && setCreating(false)}
        saving={saving}
        onSubmit={handleCreate}
      />

      <CustomerFormDialog
        open={Boolean(editing)}
        mode="edit"
        onOpenChange={(open) => !open && setEditing(null)}
        initial={editing ? {
          name: editing.name,
          email: editing.email,
          phone: '',
          company_name: editing.company,
          is_active: editing.is_active,
        } : null}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete customer?"
        description={deleteTarget ? `This will permanently remove ${deleteTarget.name} and their orders, subscriptions, and invoices.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
