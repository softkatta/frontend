import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Eye, RefreshCw } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapSubscription } from '@/lib/apiMappers'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { Subscription } from '@/types'

const statusVariant = { active: 'success', expired: 'destructive', cancelled: 'secondary', pending: 'warning' } as const

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => clientApi.subscriptions.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapSubscription), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<Subscription | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await clientApi.subscriptions.cancel(cancelTarget.id)
      toast({ title: 'Subscription cancelled', description: 'Auto-renewal has been turned off.', variant: 'success' })
      setCancelTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Cancellation failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setCancelling(false)
    }
  }

  const tableData = useMemo(() => items, [items])

  return (
    <>
      <PortalPageShell
        eyebrow="Billing"
        heroTitle="Subscriptions"
        heroDescription="Manage your active product subscriptions and renewal settings."
        title="Subscriptions"
        description="Manage your product subscriptions"
        actions={
          <Button onClick={() => navigate('/products')} className="rounded-xl glow-btn">
            Add Subscription
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['product_name']}
          searchPlaceholder="Search subscriptions..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' },
            ]},
          ]}
          pageSize={5}
          data={tableData}
          columns={[
            { key: 'product_name', header: 'Product', className: 'font-medium' },
            { key: 'plan', header: 'Plan', render: (s) => <span className="capitalize">{s.plan}</span> },
            { key: 'status', header: 'Status', render: (s) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge> },
            { key: 'amount', header: 'Amount', render: (s) => formatCurrency(s.amount) },
            { key: 'end_date', header: 'Expires', render: (s) => formatDate(s.end_date) },
            { key: 'auto_renew', header: 'Auto Renew', render: (s) => s.auto_renew ? 'Yes' : 'No' },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (s) => (
              <TableActions actions={[
                actionBtn('View details', Eye, () => setDetail(s)),
                { ...actionBtn('Renew', RefreshCw, () => navigate('/products')), hidden: s.status !== 'expired' },
                { ...actionBtn('Cancel', Ban, () => setCancelTarget(s)), variant: 'destructive', hidden: s.status !== 'active' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Subscription details">
        {detail && (
          <>
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Plan" value={<span className="capitalize">{detail.plan}</span>} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            <DetailRow label="Expires" value={formatDate(detail.end_date)} />
            <DetailRow label="Auto renew" value={detail.auto_renew ? 'Yes' : 'No'} />
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel subscription?"
        description={`Auto-renewal for ${cancelTarget?.product_name ?? 'this product'} will be turned off.`}
        confirmLabel="Cancel subscription"
        loading={cancelling}
        onConfirm={handleCancel}
      />
    </>
  )
}
