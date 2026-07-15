import { useCallback, useState } from 'react'
import { Eye, Power, PowerOff, RotateCcw } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { clientApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { unwrapList, getApiErrorMessage } from '@/lib/apiHelpers'
import { mapAdminLicense } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'
import { toast } from '@/components/ui/toaster'

const statusVariant = {
  active: 'success',
  suspended: 'warning',
  expired: 'destructive',
  revoked: 'secondary',
} as const

type LicenseRow = ReturnType<typeof mapAdminLicense>

export default function LicensesPage() {
  const fetcher = useCallback(() => clientApi.licenses.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminLicense), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<LicenseRow | null>(null)
  const [domainInput, setDomainInput] = useState('')
  const [busy, setBusy] = useState(false)

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
                <RotateCcw className="h-4 w-4 mr-1" /> Request Domain Reset
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
    </>
  )
}
