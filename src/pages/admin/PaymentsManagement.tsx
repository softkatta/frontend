import { useCallback, useState } from 'react'
import { Eye, IndianRupee, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RecordPaymentDialog, type RecordPaymentTarget } from '@/components/admin/RecordPaymentDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { unwrapList } from '@/lib/apiHelpers'
import { mapAdminPayment } from '@/lib/apiMappers'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const statusVariant = {
  completed: 'success',
  pending: 'warning',
  processing: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
  cancelled: 'secondary',
} as const

type PaymentRow = ReturnType<typeof mapAdminPayment>

export default function PaymentsManagement() {
  const fetcher = useCallback(() => adminApi.payments.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminPayment), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<PaymentRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<RecordPaymentTarget | null>(null)
  const [recordingPayment, setRecordingPayment] = useState(false)

  const handleRecordPayment = async (payload: {
    payment_method: 'cash' | 'cheque'
    reference?: string
    notes?: string
  }) => {
    if (!paymentTarget) return
    setRecordingPayment(true)
    try {
      await adminApi.payments.record({
        ...(paymentTarget.paymentId ? { payment_id: paymentTarget.paymentId } : {}),
        ...(paymentTarget.invoiceId ? { invoice_id: paymentTarget.invoiceId } : {}),
        ...(paymentTarget.orderId ? { order_id: paymentTarget.orderId } : {}),
        ...payload,
      })
      toast({
        title: 'Payment recorded',
        description: paymentTarget.label,
        variant: 'success',
      })
      setPaymentTarget(null)
      setDetail(null)
      await reload()
    } catch (err) {
      toast({ title: 'Payment failed', description: getApiErrorMessage(err), variant: 'destructive' })
      throw err
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.payments.delete(deleteTarget.id)
      toast({ title: 'Payment deleted', description: deleteTarget.transaction_id ?? `#${deleteTarget.id}`, variant: 'success' })
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
        heroTitle="Payments"
        heroDescription="Monitor payment transactions across gateways and customers."
        title="Payments"
        description="View all payment transactions across the platform"
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['transaction_id', 'customer_name', 'order_number', 'invoice_number', 'payment_mode']}
          searchPlaceholder="Search payments..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
            {
              key: 'payment_mode',
              label: 'Payment Mode',
              options: [
                { value: 'Manual', label: 'Manual' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Razorpay', label: 'Razorpay' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Card', label: 'Card' },
                { value: 'Net Banking', label: 'Net Banking' },
                { value: 'Stripe', label: 'Stripe' },
                { value: 'PayU', label: 'PayU' },
                { value: 'Cashfree', label: 'Cashfree' },
              ],
            },
          ]}
          pageSize={8}
          data={items}
          columns={[
            {
              key: 'transaction_id',
              header: 'Transaction ID',
              className: 'font-medium font-mono text-xs',
              render: (p) => p.transaction_id ?? '—',
            },
            { key: 'customer_name', header: 'Customer' },
            { key: 'payment_mode', header: 'Payment Mode', render: (p) => p.payment_mode },
            { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
            {
              key: 'status',
              header: 'Status',
              render: (p) => (
                <Badge variant={statusVariant[p.status as keyof typeof statusVariant] ?? 'secondary'}>
                  {p.status}
                </Badge>
              ),
            },
            { key: 'created_at', header: 'Date', render: (p) => formatDate(p.created_at) },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[140px] text-right',
              render: (p) => (
                <TableActions actions={[
                  actionBtn('View payment', Eye, () => setDetail(p)),
                  {
                    ...actionBtn('Record', IndianRupee, () => setPaymentTarget({
                      paymentId: p.id,
                      invoiceId: p.invoice_id,
                      orderId: p.order_id,
                      label: p.invoice_number ?? p.order_number ?? p.transaction_id ?? `Payment #${p.id}`,
                      amount: p.amount,
                    })),
                    hidden: p.status !== 'pending',
                  },
                  { ...actionBtn('Delete payment', Trash2, () => setDeleteTarget(p)), variant: 'destructive' },
                ]} />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Payment details">
        {detail && (
          <>
            <DetailRow label="Payment ID" value={`#${detail.id}`} />
            <DetailRow label="Transaction ID" value={detail.transaction_id ?? '—'} />
            <DetailRow label="Customer" value={detail.customer_name} />
            <DetailRow label="Payment Mode" value={detail.payment_mode} />
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Order" value={detail.order_number ?? '—'} />
            <DetailRow label="Invoice" value={detail.invoice_number ?? '—'} />
            <DetailRow label="Date" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>

      <RecordPaymentDialog
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
        target={paymentTarget}
        loading={recordingPayment}
        onSubmit={handleRecordPayment}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete payment?"
        description={deleteTarget ? `Remove payment record ${deleteTarget.transaction_id ?? `#${deleteTarget.id}`}? The related order and invoice will remain.` : ''}
        confirmLabel="Delete payment"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
