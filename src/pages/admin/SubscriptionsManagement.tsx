import { useCallback, useState } from 'react'
import { Ban, Eye, FileText, IndianRupee, Pencil, Plus, Trash2 } from 'lucide-react'
import { CreateSubscriptionDialog, type CreateSubscriptionValues } from '@/components/admin/CreateSubscriptionDialog'
import { SubscriptionFormDialog, type SubscriptionFormValues } from '@/components/admin/SubscriptionFormDialog'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import {
  RecordPaymentDialog,
  type RecordPaymentPayload,
  type RecordPaymentTarget,
} from '@/components/admin/RecordPaymentDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminSubscription } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const statusVariant = {
  active: 'success',
  expired: 'destructive',
  cancelled: 'secondary',
  pending: 'warning',
  expiring_soon: 'warning',
  suspend: 'warning',
} as const

const paymentStatusVariant = {
  paid: 'success',
  partial: 'warning',
  pending: 'warning',
  none: 'secondary',
} as const

type SubRow = ReturnType<typeof mapAdminSubscription>

export default function SubscriptionsManagement() {
  const fetcher = useCallback(() => adminApi.subscriptions.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminSubscription), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<SubRow | null>(null)
  const [editing, setEditing] = useState<SubRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<SubRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SubRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<RecordPaymentTarget | null>(null)
  const [recordingPayment, setRecordingPayment] = useState(false)

  const handleRecordPayment = async (payload: RecordPaymentPayload) => {
    if (!paymentTarget?.subscriptionId) return
    setRecordingPayment(true)
    try {
      await adminApi.payments.record({
        subscription_id: paymentTarget.subscriptionId,
        ...(paymentTarget.invoiceId ? { invoice_id: paymentTarget.invoiceId } : {}),
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

  const handleCreate = async (values: CreateSubscriptionValues) => {
    setCreating(true)
    try {
      await adminApi.subscriptions.create({
        user_id: Number(values.user_id),
        product_id: Number(values.product_id),
        plan_id: Number(values.plan_id),
        status: values.status,
        auto_renew: values.auto_renew,
        apply_trial: values.apply_trial,
        starts_at: values.starts_at || null,
        ends_at: values.ends_at || null,
        create_billing: true,
      })
      toast({
        title: 'Subscription created',
        description: 'Billing is pending — record cash, cheque, or online when payment is received.',
        variant: 'success',
      })
      setCreateOpen(false)
      await reload()
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async (values: SubscriptionFormValues) => {
    if (!editing) return
    setSaving(true)
    try {
      await adminApi.subscriptions.update(editing.id, {
        status: values.status,
        auto_renew: values.auto_renew,
        starts_at: values.starts_at || null,
        ends_at: values.ends_at || null,
      })
      toast({ title: 'Subscription updated', variant: 'success' })
      setEditing(null)
      await reload()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await adminApi.subscriptions.cancel(cancelTarget.id)
      toast({ title: 'Subscription cancelled', description: cancelTarget.product, variant: 'success' })
      setCancelTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Cancel failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setCancelling(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.subscriptions.delete(deleteTarget.id)
      toast({ title: 'Subscription deleted', description: deleteTarget.product, variant: 'success' })
      setDeleteTarget(null)
      setDetail(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateBilling = async (subscriptionId: string, productLabel: string) => {
    try {
      await adminApi.subscriptions.createBilling(subscriptionId)
      toast({
        title: 'Billing created',
        description: `Pending order, invoice, and payment created for ${productLabel}.`,
        variant: 'success',
      })
      await reload()
    } catch (err) {
      toast({ title: 'Billing failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Billing"
        heroTitle="Subscriptions"
        heroDescription="Track active, pending, and cancelled subscriptions for all customers."
        title="Subscriptions Management"
        description="View and manage all subscriptions"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" />
            Add Subscription
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['customer', 'product', 'customer_email']}
          searchPlaceholder="Search subscriptions..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'suspend', label: 'Suspended' },
              { value: 'expired', label: 'Expired' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'customer', header: 'Customer', className: 'font-medium' },
            { key: 'product', header: 'Product' },
            { key: 'plan', header: 'Plan', render: (s) => <span className="capitalize">{s.plan}</span> },
            { key: 'status', header: 'Status', render: (s) => <Badge variant={statusVariant[s.status as keyof typeof statusVariant] ?? 'secondary'}>{s.status.replace('_', ' ')}</Badge> },
            {
              key: 'payment_status',
              header: 'Payment',
              render: (s) => (
                <Badge variant={paymentStatusVariant[s.payment_status as keyof typeof paymentStatusVariant] ?? 'secondary'}>
                  {s.payment_status === 'none' ? '—' : s.payment_status}
                  {s.payment_status === 'partial' || s.payment_status === 'pending'
                    ? ` · ${formatCurrency(s.amount_due)}`
                    : ''}
                </Badge>
              ),
            },
            { key: 'amount', header: 'Amount', render: (s) => formatCurrency(s.amount) },
            { key: 'end_date', header: 'Expires', render: (s) => formatDate(s.end_date) },
            { key: 'actions', header: 'Actions', className: 'w-[180px] text-right', render: (s) => (
              <TableActions actions={[
                actionBtn('View subscription', Eye, () => setDetail(s)),
                {
                  ...actionBtn('Create billing', FileText, () => void handleCreateBilling(s.id, s.product)),
                  hidden: s.payment_status !== 'none',
                },
                {
                  ...actionBtn('Record', IndianRupee, () => setPaymentTarget({
                    subscriptionId: s.id,
                    invoiceId: s.invoice_id,
                    label: `${s.customer} · ${s.product}`,
                    amount: s.amount_due > 0 ? s.amount_due : s.amount,
                  })),
                  hidden: s.payment_status !== 'pending' && s.payment_status !== 'partial',
                },
                actionBtn('Edit subscription', Pencil, () => setEditing(s)),
                {
                  ...actionBtn('Cancel subscription', Ban, () => setCancelTarget(s)),
                  variant: 'destructive',
                  hidden: s.status === 'expired' || s.status === 'expiring_soon',
                },
                { ...actionBtn('Delete subscription', Trash2, () => setDeleteTarget(s)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Subscription details">
        {detail && (
          <>
            <DetailRow label="Customer" value={detail.customer} />
            <DetailRow label="Email" value={detail.customer_email || '—'} />
            <DetailRow label="Product" value={detail.product} />
            <DetailRow label="Plan" value={<span className="capitalize">{detail.plan}</span>} />
            <DetailRow label="Status" value={detail.status.replace('_', ' ')} />
            <DetailRow label="Payment" value={detail.payment_status === 'none' ? '—' : detail.payment_status} />
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            {detail.payment_status === 'pending' || detail.payment_status === 'partial' ? (
              <DetailRow label="Amount due" value={formatCurrency(detail.amount_due)} />
            ) : null}
            {detail.amount_paid > 0 ? (
              <DetailRow label="Amount paid" value={formatCurrency(detail.amount_paid)} />
            ) : null}
            <DetailRow label="Auto renew" value={detail.auto_renew ? 'Yes' : 'No'} />
            <DetailRow label="Started" value={detail.start_date ? formatDate(detail.start_date) : '—'} />
            <DetailRow label="Expires" value={detail.end_date ? formatDate(detail.end_date) : '—'} />
            {detail.cancelled_at ? (
              <DetailRow label="Cancelled" value={formatDate(detail.cancelled_at)} />
            ) : null}
          </>
        )}
      </DetailDialog>

      <CreateSubscriptionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        saving={creating}
        onSubmit={handleCreate}
      />

      <SubscriptionFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        customer={editing?.customer}
        product={editing?.product}
        initial={editing ? {
          status: editing.status,
          auto_renew: editing.auto_renew,
          starts_at: editing.start_date,
          ends_at: editing.end_date,
        } : null}
        saving={saving}
        onSubmit={handleSave}
      />

      <RecordPaymentDialog
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
        target={paymentTarget}
        loading={recordingPayment}
        onSubmit={handleRecordPayment}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel subscription?"
        description={cancelTarget ? `${cancelTarget.customer}'s ${cancelTarget.product} subscription will stop auto-renewing.` : ''}
        confirmLabel="Cancel subscription"
        loading={cancelling}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete subscription?"
        description={deleteTarget ? `Permanently remove ${deleteTarget.customer}'s ${deleteTarget.product} subscription? Linked invoices are kept.` : ''}
        confirmLabel="Delete subscription"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
