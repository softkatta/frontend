import { useCallback, useState } from 'react'
import { Activity, Eye, History, Power, PowerOff, RotateCcw, Server, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { clientApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { asRecord, asString, asNumber, asBool, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminLicense } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'
import { toast } from '@/components/ui/toaster'
import { openRazorpayCheckout } from '@/lib/razorpay'

const statusVariant = {
  active: 'success',
  suspended: 'warning',
  expired: 'destructive',
  revoked: 'secondary',
} as const

type LicenseRow = ReturnType<typeof mapAdminLicense>

type LogRow = {
  id: string
  endpoint: string
  domain: string
  success: boolean
  error_code: string
  created_at: string
}

type HistoryRow = {
  id: string
  event: string
  created_at: string
}

type InstallationRow = {
  id: string
  installation_id: string
  domain: string
  product_version: string
  last_verified_at: string
  revoked_at: string
}

export default function LicensesPage() {
  const fetcher = useCallback(() => clientApi.licenses.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminLicense), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<LicenseRow | null>(null)
  const [domainInput, setDomainInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState<LogRow[] | null>(null)
  const [history, setHistory] = useState<HistoryRow[] | null>(null)
  const [installations, setInstallations] = useState<InstallationRow[] | null>(null)
  const [buyUsers, setBuyUsers] = useState('0')
  const [buyStudents, setBuyStudents] = useState('0')
  const [buyingSeats, setBuyingSeats] = useState(false)

  const runAction = async (action: () => Promise<unknown>, successTitle: string) => {
    if (!detail) return
    setBusy(true)
    try {
      await action()
      toast({ title: successTitle, variant: 'success' })
      await reload()
      const refreshed = unwrapList(await clientApi.licenses.list()).map(mapAdminLicense)
      const updated = refreshed.find((item) => item.id === detail.id)
      if (updated) setDetail(updated)
    } catch (err) {
      toast({ title: 'Action failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const purchaseExtraSeats = async () => {
    if (!detail) return
    const extraUsers = Math.max(0, Number(buyUsers) || 0)
    const extraStudents = Math.max(0, Number(buyStudents) || 0)
    if (extraUsers === 0 && extraStudents === 0) {
      toast({ title: 'Select seats', description: 'Enter at least one extra user or student.', variant: 'destructive' })
      return
    }
    if ((detail.price_per_extra_user ?? 0) <= 0 && extraUsers > 0) {
      toast({ title: 'Users not for sale', description: 'SoftKatta has not set a price per extra user for this product.', variant: 'destructive' })
      return
    }
    if ((detail.price_per_extra_student ?? 0) <= 0 && extraStudents > 0) {
      toast({ title: 'Students not for sale', description: 'SoftKatta has not set a price per extra student for this product.', variant: 'destructive' })
      return
    }

    setBuyingSeats(true)
    try {
      const result = asRecord(await clientApi.licenses.purchaseExtraSeats(detail.id, {
        extra_users: extraUsers,
        extra_students: extraStudents,
        payment_gateway: 'razorpay',
      }))
      const payment = asRecord(result.payment)
      const checkout = asRecord(result.checkout)
      const paymentId = asString(payment.id)
      const razorpayOrderId = asString(checkout.razorpay_order_id ?? checkout.transaction_id)
      const razorpayKeyId = asString(checkout.razorpay_key_id)

      if (asBool(checkout.stub) || !razorpayKeyId) {
        toast({
          title: 'Payment gateway not configured',
          description: 'Ask SoftKatta Admin to configure Razorpay before buying seats.',
          variant: 'destructive',
        })
        return
      }

      const amountPaise = Number(checkout.amount_paise ?? Math.round(asNumber(asRecord(result.quote).total) * 100))
      const response = await openRazorpayCheckout({
        key: razorpayKeyId,
        amount: amountPaise,
        currency: asString(checkout.currency, 'INR'),
        name: 'SoftKatta',
        description: `Extra seats — ${detail.product_name}`,
        order_id: razorpayOrderId,
        theme: { color: '#1e40af' },
      })

      await clientApi.payments.verify({
        payment_id: paymentId,
        ...response,
      })

      toast({ title: 'Seats added', description: 'Extra seats are active after the next product license check.', variant: 'success' })
      setBuyUsers('0')
      setBuyStudents('0')
      await reload()
      const refreshed = unwrapList(await clientApi.licenses.list()).map(mapAdminLicense)
      const updated = refreshed.find((item) => item.id === detail.id)
      if (updated) setDetail(updated)
    } catch (err) {
      toast({ title: 'Purchase failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBuyingSeats(false)
    }
  }

  const loadActivity = async (row: LicenseRow) => {
    try {
      const response = await clientApi.licenses.activity(row.id)
      setActivity(unwrapList(response).map((item) => {
        const log = asRecord(item)
        return {
          id: asString(log.id),
          endpoint: asString(log.endpoint),
          domain: asString(log.domain, '—'),
          success: Boolean(log.success),
          error_code: asString(log.error_code, '—'),
          created_at: asString(log.created_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load activity', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const loadHistory = async (row: LicenseRow) => {
    try {
      const response = await clientApi.licenses.history(row.id)
      setHistory(unwrapList(response).map((item) => {
        const event = asRecord(item)
        return {
          id: asString(event.id),
          event: asString(event.event),
          created_at: asString(event.created_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load history', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const loadInstallations = async (row: LicenseRow) => {
    try {
      const response = await clientApi.licenses.installations(row.id)
      setInstallations(unwrapList(response).map((item) => {
        const rowItem = asRecord(item)
        return {
          id: asString(rowItem.id),
          installation_id: asString(rowItem.installation_id),
          domain: asString(rowItem.domain, '—'),
          product_version: asString(rowItem.product_version, '—'),
          last_verified_at: asString(rowItem.last_verified_at),
          revoked_at: asString(rowItem.revoked_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load installations', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Account"
        heroTitle="License Keys"
        heroDescription="Manage your license, registered domains, and product installation settings."
        title="License Keys"
        description="Each license works only on registered domain(s)."
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['product_name', 'license_key']}
          searchPlaceholder="Search licenses..."
          pageSize={10}
          data={items}
          columns={[
            {
              key: 'license_key',
              header: 'License Key',
              render: (row: LicenseRow) => (
                <span className="font-mono text-xs text-[var(--brand-blue)]">{row.license_key}</span>
              ),
            },
            { key: 'product_name', header: 'Product', className: 'font-medium' },
            { key: 'plan_name', header: 'Plan' },
            {
              key: 'allowed_domains',
              header: 'Domains',
              render: (row: LicenseRow) =>
                row.allowed_domains.length > 0
                  ? row.allowed_domains.join(', ')
                  : <span className="text-[var(--muted-foreground)] text-xs">Not registered</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: LicenseRow) => (
                <Badge variant={statusVariant[row.status as keyof typeof statusVariant] ?? 'secondary'}>
                  {row.status}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (row: LicenseRow) => (
                <TableActions actions={[actionBtn('Manage', Eye, () => setDetail(row))]} />
              ),
            },
          ]}
          emptyTitle="No license keys yet"
          emptyDescription="Your license keys will appear here once you purchase a product subscription."
        />
      </PortalPageShell>

      <DetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title="License Management"
      >
        {detail && (
          <>
            <DetailRow
              label="License Key"
              value={(
                <span className="font-mono text-xs break-all text-[var(--brand-blue)] select-all">
                  {detail.license_key}
                </span>
              )}
            />
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Plan" value={detail.plan_name} />
            <DetailRow
              label="Seat limits"
              value={`Plan users ${detail.plan_max_users ?? '—'} + extras ${detail.extra_max_users ?? 0} = ${detail.effective_max_users ?? '—'} · Plan students ${detail.plan_max_students ?? '—'} + extras ${detail.extra_max_students ?? 0} = ${detail.effective_max_students ?? '—'}`}
            />
            <div className="rounded-xl border border-[var(--border)] p-3 space-y-3">
              <p className="text-sm font-medium">Buy extra seats</p>
              <p className="text-xs text-muted-foreground">
                User: {formatCurrency(detail.price_per_extra_user ?? 0)} each · Student: {formatCurrency(detail.price_per_extra_student ?? 0)} each (+ GST)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Extra users</p>
                  <Input
                    type="number"
                    min={0}
                    value={buyUsers}
                    onChange={(e) => setBuyUsers(e.target.value)}
                    disabled={(detail.price_per_extra_user ?? 0) <= 0 || buyingSeats}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Extra students</p>
                  <Input
                    type="number"
                    min={0}
                    value={buyStudents}
                    onChange={(e) => setBuyStudents(e.target.value)}
                    disabled={(detail.price_per_extra_student ?? 0) <= 0 || buyingSeats}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => void purchaseExtraSeats()}
                disabled={buyingSeats || ((detail.price_per_extra_user ?? 0) <= 0 && (detail.price_per_extra_student ?? 0) <= 0)}
              >
                {buyingSeats ? 'Processing…' : 'Pay & add seats'}
              </Button>
            </div>
            <DetailRow
              label="API URL"
              value={(
                <span className="font-mono text-xs break-all select-all">
                  {detail.api_url || '—'}
                </span>
              )}
            />
            <DetailRow
              label="API Key"
              value={(
                <span className="font-mono text-xs break-all select-all">
                  {detail.api_key || '—'}
                </span>
              )}
            />
            <DetailRow
              label="Product Slug"
              value={<span className="font-mono text-xs select-all">{detail.product_slug || '—'}</span>}
            />
            <DetailRow
              label="Product Version"
              value={<span className="font-mono text-xs select-all">{detail.product_version || '—'}</span>}
            />
            <DetailRow label="Status" value={<Badge variant={statusVariant[detail.status as keyof typeof statusVariant] ?? 'secondary'}>{detail.status}</Badge>} />
            <DetailRow label="Max Domains" value={String(detail.max_domains ?? 1)} />
            <DetailRow label="Max Devices" value={String(detail.max_devices)} />
            <DetailRow
              label="Registered Domains"
              value={
                detail.allowed_domains.length > 0
                  ? detail.allowed_domains.join(', ')
                  : <span className="text-[var(--muted-foreground)] text-xs">No domain registered yet</span>
              }
            />

            <div className="space-y-2 py-2">
              <p className="text-sm font-medium">Register Domain</p>
              <div className="flex gap-2">
                <Input
                  placeholder="erp.youracademy.com"
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                />
                <Button
                  disabled={busy || !domainInput.trim()}
                  onClick={() => runAction(
                    () => clientApi.licenses.registerDomain(detail.id, { domain: domainInput.trim() }),
                    'Domain registered',
                  )}
                >
                  Add
                </Button>
              </div>
              {detail.allowed_domains.map((domain) => (
                <div key={domain} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs">{domain}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => runAction(
                      () => clientApi.licenses.removeDomain(detail.id, { domain }),
                      'Domain removed',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => runAction(() => clientApi.licenses.activateProduct(detail.id), 'Product activated')}
              >
                <Power className="h-4 w-4 mr-1" /> Activate Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => runAction(() => clientApi.licenses.deactivateProduct(detail.id), 'Product deactivated')}
              >
                <PowerOff className="h-4 w-4 mr-1" /> Deactivate Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => runAction(
                  () => clientApi.licenses.requestDomainReset(detail.id, { reason: 'Customer requested domain reset' }),
                  'Domain reset request submitted',
                )}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Request Domain Transfer
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => loadActivity(detail)}>
                <Activity className="h-4 w-4 mr-1" /> API Activity
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => loadHistory(detail)}>
                <History className="h-4 w-4 mr-1" /> Installation History
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => loadInstallations(detail)}>
                <Server className="h-4 w-4 mr-1" /> Installations
              </Button>
            </div>

            <DetailRow label="Activated On" value={detail.activated_at ? formatDate(detail.activated_at) : '—'} />
            <DetailRow label="Valid Until" value={detail.expires_at ? formatDate(detail.expires_at) : 'Lifetime'} />
            {detail.last_verified_at && (
              <DetailRow label="Last API Use" value={formatDate(detail.last_verified_at)} />
            )}
          </>
        )}
      </DetailDialog>

      <DetailDialog open={activity !== null} onOpenChange={(open) => !open && setActivity(null)} title="API Activity">
        {(activity ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No API activity yet.</p>
        ) : (
          activity?.map((row) => (
            <DetailRow
              key={row.id}
              label={row.endpoint}
              value={(
                <span className="text-xs">
                  {row.domain} · {row.success ? 'OK' : row.error_code}
                  {row.created_at ? ` · ${formatDate(row.created_at)}` : ''}
                </span>
              )}
            />
          ))
        )}
      </DetailDialog>

      <DetailDialog open={history !== null} onOpenChange={(open) => !open && setHistory(null)} title="License History">
        {(history ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No history yet.</p>
        ) : (
          history?.map((row) => (
            <DetailRow
              key={row.id}
              label={row.event.replaceAll('_', ' ')}
              value={row.created_at ? formatDate(row.created_at) : '—'}
            />
          ))
        )}
      </DetailDialog>

      <DetailDialog open={installations !== null} onOpenChange={(open) => !open && setInstallations(null)} title="Installations">
        {(installations ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No installations yet.</p>
        ) : (
          installations?.map((row) => (
            <div key={row.id} className="space-y-1 border-b border-[var(--border)] pb-3 last:border-0">
              <DetailRow label="Installation ID" value={<span className="font-mono text-xs break-all">{row.installation_id}</span>} />
              <DetailRow label="Domain" value={row.domain} />
              <DetailRow label="Version" value={row.product_version} />
              <DetailRow label="Last Verified" value={row.last_verified_at ? formatDate(row.last_verified_at) : '—'} />
              <DetailRow label="Status" value={row.revoked_at ? `Deactivated ${formatDate(row.revoked_at)}` : 'Active'} />
              {!row.revoked_at && detail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => runAction(
                    () => clientApi.licenses.deactivateInstallation(detail.id, row.id),
                    'Installation deactivated',
                  ).then(() => loadInstallations(detail))}
                >
                  Deactivate Installation
                </Button>
              )}
            </div>
          ))
        )}
      </DetailDialog>
    </>
  )
}
