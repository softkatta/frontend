import { useCallback, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { ProductFormDialog, type ProductFormValues } from '@/components/admin/ProductFormDialog'
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
import { mapApiProduct } from '@/lib/apiMappers'
import { saveProduct } from '@/lib/productAdmin'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { Product } from '@/types'

export default function ProductsManagement() {
  const fetcher = useCallback(() => adminApi.products.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapApiProduct), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingRaw, setEditingRaw] = useState<unknown>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditingProduct(null)
    setEditingRaw(null)
    setFormOpen(true)
  }

  const openEdit = async (product: Product) => {
    try {
      const raw = await adminApi.products.get(product.id)
      setEditingProduct(mapApiProduct(raw))
      setEditingRaw(raw)
      setFormOpen(true)
    } catch (err) {
      toast({ title: 'Could not load product', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleSave = async (values: ProductFormValues) => {
    setSaving(true)
    try {
      await saveProduct(values, editingProduct?.id)
      toast({
        title: editingProduct ? 'Product updated' : 'Product created',
        description: values.name,
        variant: 'success',
      })
      setFormOpen(false)
      setEditingProduct(null)
      setEditingRaw(null)
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
      await adminApi.products.delete(deleteTarget.id)
      toast({ title: 'Product deleted', description: deleteTarget.name, variant: 'success' })
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
        heroTitle="Products"
        heroDescription="Manage your software catalog, pricing, and visibility on the public shop."
        title="Products Management"
        description="Manage all platform products"
        actions={
          <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'category']}
          searchPlaceholder="Search products..."
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
            { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
            { key: 'price_monthly', header: 'Monthly', render: (p) => p.price_monthly > 0 ? formatCurrency(p.price_monthly) : '—' },
            { key: 'price_yearly', header: 'Yearly', render: (p) => p.price_yearly > 0 ? formatCurrency(p.price_yearly) : '—' },
            { key: 'price_enterprise', header: 'Enterprise', render: (p) => (p.price_enterprise ?? 0) > 0 ? formatCurrency(p.price_enterprise!) : '—' },
            { key: 'is_active', header: 'Status', render: (p) => <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (p) => (
              <TableActions actions={[
                actionBtn('View product', Eye, () => setDetail(p)),
                actionBtn('Edit product', Pencil, () => void openEdit(p)),
                { ...actionBtn('Delete product', Trash2, () => setDeleteTarget(p)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Product details">
        {detail && (
          <>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Slug" value={detail.slug} />
            <DetailRow label="Category" value={detail.category} />
            <DetailRow label="Monthly" value={detail.price_monthly > 0 ? formatCurrency(detail.price_monthly) : '— (add plan)'} />
            <DetailRow label="Yearly" value={detail.price_yearly > 0 ? formatCurrency(detail.price_yearly) : '— (add plan)'} />
            <DetailRow label="Enterprise" value={(detail.price_enterprise ?? 0) > 0 ? formatCurrency(detail.price_enterprise!) : '— (add plan)'} />
            <DetailRow label="Free trial" value={detail.has_free_trial ? `Enabled (${detail.trial_days} days)` : 'Disabled'} />
            <DetailRow label="Features" value={detail.features.length ? detail.features.join(', ') : '—'} />
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
            {detail.description && <DetailRow label="Description" value={detail.description} />}
          </>
        )}
      </DetailDialog>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingProduct(null)
            setEditingRaw(null)
          }
        }}
        initial={editingProduct}
        productRaw={editingRaw}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete product?"
        description={`This will permanently remove ${deleteTarget?.name ?? 'this product'}.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
