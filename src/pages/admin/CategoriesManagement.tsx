import { useCallback, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { CategoryFormDialog, type CategoryFormValues } from '@/components/admin/CategoryFormDialog'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminCategory } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type CategoryRow = ReturnType<typeof mapAdminCategory>

function categoryPayload(values: CategoryFormValues) {
  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description || undefined,
    icon: values.icon || undefined,
    is_active: values.is_active,
    sort_order: values.sort_order,
  }
}

export default function CategoriesManagement() {
  const fetcher = useCallback(() => adminApi.productCategories.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminCategory), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<CategoryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<CategoryFormValues | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setEditingValues(null)
    setFormOpen(true)
  }

  const openEdit = (category: CategoryRow) => {
    setEditingId(category.id)
    setEditingValues({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      is_active: category.is_active,
      sort_order: category.sort_order,
    })
    setFormOpen(true)
  }

  const handleSave = async (values: CategoryFormValues) => {
    setSaving(true)
    try {
      const payload = categoryPayload(values)
      if (editingId) {
        await adminApi.productCategories.update(editingId, payload)
        toast({ title: 'Category updated', description: values.name, variant: 'success' })
      } else {
        await adminApi.productCategories.create(payload)
        toast({ title: 'Category created', description: values.name, variant: 'success' })
      }
      setFormOpen(false)
      setEditingId(null)
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
      await adminApi.productCategories.delete(deleteTarget.id)
      toast({ title: 'Category deleted', description: deleteTarget.name, variant: 'success' })
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
        heroTitle="Categories"
        heroDescription="Organize products into categories for the public software shop."
        title="Categories"
        description="Manage product categories for the shop"
        actions={
          <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'slug']}
          searchPlaceholder="Search categories..."
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
            { key: 'slug', header: 'Slug' },
            { key: 'products_count', header: 'Products', render: (c) => c.products_count },
            { key: 'sort_order', header: 'Order' },
            { key: 'is_active', header: 'Status', render: (c) => <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (c) => (
              <TableActions actions={[
                actionBtn('View category', Eye, () => setDetail(c)),
                actionBtn('Edit category', Pencil, () => openEdit(c)),
                { ...actionBtn('Delete category', Trash2, () => setDeleteTarget(c)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Category details">
        {detail && (
          <>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Slug" value={detail.slug} />
            <DetailRow label="Products" value={detail.products_count} />
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
            {detail.description ? <DetailRow label="Description" value={detail.description} /> : null}
          </>
        )}
      </DetailDialog>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingId(null)
            setEditingValues(null)
          }
        }}
        initial={editingValues}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={`This will permanently remove ${deleteTarget?.name ?? 'this category'}.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
