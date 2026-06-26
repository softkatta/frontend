import { useCallback, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminOrder } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const statusVariant = { completed: 'success', pending: 'warning', cancelled: 'secondary', refunded: 'destructive' } as const

type OrderRow = ReturnType<typeof mapAdminOrder>

export default function OrdersPage() {
  const fetcher = useCallback(() => adminApi.orders.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminOrder), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<OrderRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.orders.delete(deleteTarget.id)
      toast({ title: 'Order deleted', description: deleteTarget.order_number, variant: 'success' })
      setDeleteTarget(null)
      setDetail(null)
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
        eyebrow="Billing"
        heroTitle="Orders"
        heroDescription="View customer orders and their linked invoices and payments."
        title="Orders"
        description="View and manage customer orders — deleting removes linked invoices and payments"
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['order_number', 'customer_name', 'product_name']}
          searchPlaceholder="Search orders..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'order_number', header: 'Order #', className: 'font-medium' },
            { key: 'customer_name', header: 'Customer' },
            { key: 'product_name', header: 'Product' },
            { key: 'amount', header: 'Amount', render: (o) => formatCurrency(o.amount) },
            { key: 'status', header: 'Status', render: (o) => <Badge variant={statusVariant[o.status as keyof typeof statusVariant] ?? 'secondary'}>{o.status}</Badge> },
            { key: 'created_at', header: 'Date', render: (o) => formatDate(o.created_at) },
            { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (o) => (
              <TableActions actions={[
                actionBtn('View order', Eye, () => setDetail(o)),
                { ...actionBtn('Delete order', Trash2, () => setDeleteTarget(o)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Order details">
        {detail && (
          <>
            <DetailRow label="Order #" value={detail.order_number} />
            <DetailRow label="Customer" value={detail.customer_name} />
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Date" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete order?"
        description={deleteTarget ? `This will permanently remove order ${deleteTarget.order_number}, its invoice(s), and payment records.` : ''}
        confirmLabel="Delete order"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
