import { useCallback, useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { CouponFormDialog, type CouponFormValues } from '@/components/admin/CouponFormDialog'
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
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { AdminCoupon } from '@/types/offers'

function mapCoupon(raw: unknown): AdminCoupon {
  const r = asRecord(raw)
  const product = asRecord(r.product)

  return {
    id: asString(r.id),
    code: asString(r.code),
    name: asString(r.name),
    type: (r.type === 'fixed' ? 'fixed' : 'percent') as AdminCoupon['type'],
    value: Number(r.value ?? 0),
    min_order_amount: r.min_order_amount != null ? Number(r.min_order_amount) : null,
    max_uses: r.max_uses != null ? Number(r.max_uses) : null,
    used_count: Number(r.used_count ?? 0),
    max_uses_per_user: r.max_uses_per_user != null ? Number(r.max_uses_per_user) : null,
    product_id: r.product_id != null ? asString(r.product_id) : null,
    product_name: product.name ? asString(product.name) : undefined,
    starts_at: r.starts_at ? asString(r.starts_at) : null,
    ends_at: r.ends_at ? asString(r.ends_at) : null,
    is_active: Boolean(r.is_active),
    description: r.description ? asString(r.description) : null,
  }
}

function toPayload(values: CouponFormValues) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    type: values.type,
    value: values.value,
    min_order_amount: values.min_order_amount > 0 ? values.min_order_amount : null,
    max_uses: values.max_uses > 0 ? values.max_uses : null,
    max_uses_per_user: values.max_uses_per_user > 0 ? values.max_uses_per_user : 1,
    product_id: values.product_id || null,
    starts_at: values.starts_at || null,
    ends_at: values.ends_at || null,
    is_active: values.is_active,
    description: values.description || null,
  }
}

export default function CouponsManagement() {
  const fetcher = useCallback(() => adminApi.coupons.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapCoupon), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [detail, setDetail] = useState<AdminCoupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void adminApi.products.list().then((res) => {
      setProducts(unwrapList(res).map((p) => {
        const r = asRecord(p)
        return { id: asString(r.id), name: asString(r.name) }
      }))
    })
  }, [])

  const handleSave = async (values: CouponFormValues) => {
    setSaving(true)
    try {
      const payload = toPayload(values)
      if (editing) {
        await adminApi.coupons.update(editing.id, payload)
        toast({ title: 'Coupon updated', description: values.code, variant: 'success' })
      } else {
        await adminApi.coupons.create(payload)
        toast({ title: 'Coupon created', description: values.code, variant: 'success' })
      }
      setFormOpen(false)
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
      await adminApi.coupons.delete(deleteTarget.id)
      toast({ title: 'Coupon deleted', description: deleteTarget.code, variant: 'success' })
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
        heroTitle="Coupons"
        heroDescription="Create discount codes customers apply at checkout."
        title="Coupons"
        description="Manage promo codes and usage limits"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['code', 'name']}
          searchPlaceholder="Search coupons..."
          pageSize={10}
          data={items}
          columns={[
            { key: 'code', header: 'Code', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
            { key: 'name', header: 'Name' },
            {
              key: 'value',
              header: 'Discount',
              render: (c) => c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value),
            },
            { key: 'used', header: 'Used', render: (c) => `${c.used_count}${c.max_uses ? ` / ${c.max_uses}` : ''}` },
            {
              key: 'status',
              header: 'Status',
              render: (c) => (
                <Badge variant={c.is_active ? 'success' : 'secondary'}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[120px] text-right',
              render: (c) => (
                <TableActions
                  actions={[
                    actionBtn('View', Eye, () => setDetail(c)),
                    actionBtn('Edit', Pencil, () => { setEditing(c); setFormOpen(true) }),
                    { ...actionBtn('Delete', Trash2, () => setDeleteTarget(c)), variant: 'destructive' },
                  ]}
                />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <CouponFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        initial={editing}
        products={products}
        saving={saving}
        onSubmit={handleSave}
      />

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title={detail?.code ?? 'Coupon'}>
        {detail && (
          <>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Discount" value={detail.type === 'percent' ? `${detail.value}%` : formatCurrency(detail.value)} />
            <DetailRow label="Min order" value={detail.min_order_amount ? formatCurrency(detail.min_order_amount) : '—'} />
            <DetailRow label="Product" value={detail.product_name ?? 'All products'} />
            <DetailRow label="Uses" value={`${detail.used_count}${detail.max_uses ? ` / ${detail.max_uses}` : ' (unlimited)'}`} />
            <DetailRow label="Description" value={detail.description ?? '—'} />
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete coupon?"
        description={`Remove ${deleteTarget?.code}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
