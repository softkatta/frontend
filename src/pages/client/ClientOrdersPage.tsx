import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ShoppingBag } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapClientOrder } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'

const statusVariant = { completed: 'success', pending: 'warning', cancelled: 'secondary', refunded: 'destructive' } as const

type OrderRow = ReturnType<typeof mapClientOrder>

export default function ClientOrdersPage() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => clientApi.orders.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapClientOrder), [])
  const { items, loading, error } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<OrderRow | null>(null)

  return (
    <>
      <PortalPageShell
        eyebrow="Billing"
        heroTitle="My Orders"
        heroDescription="Track purchases, payment status, and linked invoices."
        title="My Orders"
        description="Orders placed on your account"
        actions={
          <Button onClick={() => navigate('/products')} className="rounded-xl glow-btn">
            Browse Products
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['order_number', 'product_name']}
          searchPlaceholder="Search orders..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
          ]}
          pageSize={5}
          data={items}
          emptyTitle="No orders yet"
          emptyDescription="Your purchases will appear here after checkout."
          columns={[
            { key: 'order_number', header: 'Order #', className: 'font-medium' },
            { key: 'product_name', header: 'Product' },
            { key: 'amount', header: 'Amount', render: (o) => formatCurrency(o.amount) },
            {
              key: 'status',
              header: 'Status',
              render: (o) => (
                <Badge variant={statusVariant[o.status as keyof typeof statusVariant] ?? 'secondary'}>
                  {o.status}
                </Badge>
              ),
            },
            { key: 'created_at', header: 'Date', render: (o) => formatDate(o.created_at) },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[120px] text-right',
              render: (o) => (
                <TableActions
                  actions={[
                    actionBtn('View order', Eye, () => setDetail(o)),
                    {
                      ...actionBtn('View invoice', ShoppingBag, () => navigate(`/dashboard/invoices/${o.invoice_id}`)),
                      hidden: !o.invoice_id,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Order details">
        {detail && (
          <>
            <DetailRow label="Order #" value={detail.order_number} />
            <DetailRow label="Product" value={detail.product_name} />
            {detail.plan_name ? <DetailRow label="Plan" value={detail.plan_name} /> : null}
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            <DetailRow label="Status" value={detail.status} />
            {detail.payment_gateway ? <DetailRow label="Payment" value={detail.payment_gateway} /> : null}
            {detail.invoice_number ? <DetailRow label="Invoice" value={detail.invoice_number} /> : null}
            <DetailRow label="Date" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>
    </>
  )
}
