import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Eye, Globe, RefreshCw } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapSubscription } from '@/lib/apiMappers'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { DomainSetupStatusCode, Subscription } from '@/types'

const statusVariant = { active: 'success', expired: 'destructive', cancelled: 'secondary', pending: 'warning', suspended: 'destructive' } as const

const domainBadge: Record<DomainSetupStatusCode, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' }> = {
  none: { label: 'Domains needed', variant: 'warning' },
  skipped: { label: 'Skipped', variant: 'secondary' },
  pending: { label: 'Pending approval', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  approved: { label: 'Approved', variant: 'success' },
}

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => clientApi.subscriptions.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapSubscription), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<Subscription | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null)
  const [renewing, setRenewing] = useState(false)
  const [domainTarget, setDomainTarget] = useState<Subscription | null>(null)
  const [frontendDomain, setFrontendDomain] = useState('')
  const [backendDomain, setBackendDomain] = useState('')
  const [domainBusy, setDomainBusy] = useState(false)

  const openDomainDialog = (subscription: Subscription) => {
    setDomainTarget(subscription)
    setFrontendDomain(subscription.domain_setup?.frontend_domain || '')
    setBackendDomain(subscription.domain_setup?.backend_domain || '')
  }

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

  const handleRenew = async () => {
    if (!renewTarget) return
    setRenewing(true)
    try {
      await clientApi.subscriptions.renew(renewTarget.id)
      toast({
        title: 'Renewal invoice created',
        description: 'Complete payment from Invoices to extend your subscription.',
        variant: 'success',
      })
      setRenewTarget(null)
      await reload()
      navigate('/dashboard/invoices')
    } catch (err) {
      toast({ title: 'Renewal failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setRenewing(false)
    }
  }

  const handleSubmitDomains = async () => {
    if (!domainTarget || !frontendDomain.trim() || !backendDomain.trim()) return
    setDomainBusy(true)
    try {
      await clientApi.subscriptions.submitDomains(domainTarget.id, {
        frontend_domain: frontendDomain.trim(),
        backend_domain: backendDomain.trim(),
      })
      toast({
        title: 'Domains submitted',
        description: 'SoftKatta admin will review and approve before your license is issued.',
        variant: 'success',
      })
      setDomainTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Could not submit domains', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDomainBusy(false)
    }
  }

  const handleSkipDomains = async () => {
    if (!domainTarget) return
    setDomainBusy(true)
    try {
      await clientApi.subscriptions.skipDomains(domainTarget.id)
      toast({
        title: 'Skipped for now',
        description: 'You can add domains anytime from this page. License waits until domains are approved.',
        variant: 'success',
      })
      setDomainTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Could not skip', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDomainBusy(false)
    }
  }

  const tableData = useMemo(() => items, [items])
  const needsDomainSetup = items.filter((item) => {
    const status = item.domain_setup?.status ?? 'none'
    return status === 'none' || status === 'skipped' || status === 'rejected'
  })

  return (
    <>
      <PortalPageShell
        eyebrow="Billing"
        heroTitle="Subscriptions"
        heroDescription="Manage subscriptions, add install domains, or skip domain setup until you are ready."
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
        {needsDomainSetup.length > 0 && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
            <p className="text-sm font-medium">Set up product domains</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Add frontend + backend domains for each purchase. SoftKatta admin must approve before the license key is generated. You can skip and add later.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {needsDomainSetup.slice(0, 4).map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => openDomainDialog(item)}
                >
                  {item.product_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <DataTable
          embedded
          searchKeys={['product_name']}
          searchPlaceholder="Search subscriptions..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'suspended', label: 'Suspended' },
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
            {
              key: 'domain_setup',
              header: 'Domains',
              render: (s) => {
                const code = (s.domain_setup?.status ?? 'none') as DomainSetupStatusCode
                const meta = domainBadge[code]
                return <Badge variant={meta.variant}>{meta.label}</Badge>
              },
            },
            { key: 'amount', header: 'Amount', render: (s) => formatCurrency(s.amount) },
            { key: 'end_date', header: 'Expires', render: (s) => formatDate(s.end_date) },
            { key: 'auto_renew', header: 'Auto Renew', render: (s) => s.auto_renew ? 'Yes' : 'No' },
            { key: 'actions', header: 'Actions', className: 'w-[140px] text-right', render: (s) => {
              return (
                <TableActions actions={[
                  actionBtn('View details', Eye, () => setDetail(s)),
                  actionBtn('Domains', Globe, () => openDomainDialog(s)),
                  { ...actionBtn('Renew', RefreshCw, () => setRenewTarget(s)), hidden: s.status === 'pending' },
                  { ...actionBtn('Cancel', Ban, () => setCancelTarget(s)), variant: 'destructive', hidden: s.status !== 'active' },
                ]} />
              )
            } },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Subscription details">
        {detail && (
          <>
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Plan" value={<span className="capitalize">{detail.plan}</span>} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Domains" value={domainBadge[(detail.domain_setup?.status ?? 'none') as DomainSetupStatusCode].label} />
            {detail.domain_setup?.frontend_domain ? (
              <DetailRow label="Frontend" value={detail.domain_setup.frontend_domain} />
            ) : null}
            {detail.domain_setup?.backend_domain ? (
              <DetailRow label="Backend" value={detail.domain_setup.backend_domain} />
            ) : null}
            {detail.domain_setup?.rejection_reason ? (
              <DetailRow label="Rejection" value={detail.domain_setup.rejection_reason} />
            ) : null}
            <DetailRow label="Amount" value={formatCurrency(detail.amount)} />
            <DetailRow label="Expires" value={formatDate(detail.end_date)} />
            <DetailRow label="Auto renew" value={detail.auto_renew ? 'Yes' : 'No'} />
          </>
        )}
      </DetailDialog>

      <Dialog open={Boolean(domainTarget)} onOpenChange={(open) => !open && setDomainTarget(null)}>
        <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add install domains</DialogTitle>
            <DialogDescription>
              {domainTarget
                ? `For ${domainTarget.product_name} · ${domainTarget.plan_name || domainTarget.plan}. Admin must approve before your license key is generated.`
                : 'Enter frontend and backend domains for this purchase.'}
            </DialogDescription>
          </DialogHeader>
          {domainTarget ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Your plan: </span>
              <span className="font-medium capitalize">{domainTarget.plan_name || domainTarget.plan}</span>
            </div>
          ) : null}
          {domainTarget?.domain_setup?.status === 'rejected' && domainTarget.domain_setup.rejection_reason ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {domainTarget.domain_setup.rejection_reason}
            </p>
          ) : null}
          {domainTarget?.domain_setup?.status === 'pending' ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Your domains are waiting for SoftKatta admin approval.
            </p>
          ) : domainTarget?.domain_setup?.status === 'approved' ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-[var(--muted-foreground)]">Frontend:</span> {domainTarget.domain_setup.frontend_domain}</p>
              <p><span className="text-[var(--muted-foreground)]">Backend:</span> {domainTarget.domain_setup.backend_domain}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-frontend-domain">Frontend domain *</Label>
                <Input
                  id="client-frontend-domain"
                  value={frontendDomain}
                  onChange={(event) => setFrontendDomain(event.target.value)}
                  placeholder="app.yourdomain.com"
                  className="bg-[var(--input-background)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-backend-domain">Backend domain *</Label>
                <Input
                  id="client-backend-domain"
                  value={backendDomain}
                  onChange={(event) => setBackendDomain(event.target.value)}
                  placeholder="api.yourdomain.com"
                  className="bg-[var(--input-background)]"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {(domainTarget?.domain_setup?.status === 'none'
              || domainTarget?.domain_setup?.status === 'skipped'
              || domainTarget?.domain_setup?.status === 'rejected') && (
              <Button type="button" variant="ghost" disabled={domainBusy} onClick={() => void handleSkipDomains()}>
                Skip for now
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setDomainTarget(null)} disabled={domainBusy}>
              Close
            </Button>
            {(domainTarget?.domain_setup?.status !== 'pending' && domainTarget?.domain_setup?.status !== 'approved') && (
              <Button
                type="button"
                disabled={domainBusy || !frontendDomain.trim() || !backendDomain.trim()}
                onClick={() => void handleSubmitDomains()}
              >
                {domainBusy ? 'Submitting…' : 'Submit for approval'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(renewTarget)}
        onOpenChange={(open) => !open && setRenewTarget(null)}
        title="Create renewal invoice?"
        description={renewTarget ? `We'll create a renewal invoice for ${renewTarget.product_name}. Your access will extend once it is paid.` : ''}
        confirmLabel="Create renewal invoice"
        loading={renewing}
        onConfirm={handleRenew}
      />

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
