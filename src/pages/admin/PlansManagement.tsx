import { useCallback, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PlanFormDialog, type PlanFormValues } from '@/components/admin/PlanFormDialog'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminPlan } from '@/lib/apiMappers'
import { buildPlanFormFromProduct, saveProductPlans } from '@/lib/planAdmin'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type PlanRow = ReturnType<typeof mapAdminPlan>

export default function PlansManagement() {
  const fetcher = useCallback(() => adminApi.plans.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminPlan), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<PlanRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlanRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<PlanFormValues | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditingProductId(null)
    setEditingValues(null)
    setFormOpen(true)
  }

  const openEdit = (plan: PlanRow) => {
    setEditingProductId(plan.product_id)
    setEditingValues(buildPlanFormFromProduct(plan.product_id, items))
    setFormOpen(true)
  }

  const handleSave = async (values: PlanFormValues) => {
    setSaving(true)
    try {
      await saveProductPlans(values, items)
      toast({
        title: editingProductId ? 'Plans updated' : 'Plans created',
        description: 'Monthly, yearly, and enterprise prices saved.',
        variant: 'success',
      })
      setFormOpen(false)
      setEditingProductId(null)
      setEditingValues(null)
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
      await adminApi.plans.delete(deleteTarget.id)
      toast({ title: 'Plan deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
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
        eyebrow="Catalog"
        heroTitle="Plans"
        heroDescription="Create and manage pricing plans linked to your products."
        title="Plans"
        description="Create and manage product pricing plans"
        actions={
          <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> Add Plan
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'product_name', 'billing_cycle']}
          searchPlaceholder="Search plans..."
          filters={[
            { key: 'billing_cycle', label: 'Billing', options: [
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
              { value: 'enterprise', label: 'Enterprise' },
            ]},
            { key: 'is_active', label: 'Status', options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'name', header: 'Plan', className: 'font-medium' },
            { key: 'product_name', header: 'Product' },
            { key: 'billing_cycle', header: 'Cycle', render: (p) => <Badge variant="outline" className="capitalize">{p.billing_cycle}</Badge> },
            { key: 'price', header: 'Price', render: (p) => formatCurrency(p.price) },
            { key: 'is_active', header: 'Status', render: (p) => <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (p) => (
              <TableActions actions={[
                actionBtn('View plan', Eye, () => setDetail(p)),
                actionBtn('Edit all plans for product', Pencil, () => openEdit(p)),
                { ...actionBtn('Delete plan', Trash2, () => setDeleteTarget(p)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Plan details">
        {detail && (
          <>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Billing" value={<span className="capitalize">{detail.billing_cycle}</span>} />
            <DetailRow label="Price" value={formatCurrency(detail.price)} />
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
            <DetailRow label="Popular" value={detail.is_popular ? 'Yes' : 'No'} />
            {detail.description ? <DetailRow label="Description" value={detail.description} /> : null}
          </>
        )}
      </DetailDialog>

      <PlanFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingProductId(null)
            setEditingValues(null)
          }
        }}
        initial={editingValues}
        lockProduct={Boolean(editingProductId)}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete plan?"
        description={`This will permanently remove the ${deleteTarget?.billing_cycle ?? ''} plan for ${deleteTarget?.product_name ?? 'this product'}.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
