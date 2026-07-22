import { useCallback, useState } from 'react'
import {
  Eye, ShieldOff, ShieldCheck, Trash2, XCircle, RotateCcw, LogOut, Activity, History, Server, RefreshCw, Megaphone,
} from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { unwrapList, getApiErrorMessage, asRecord, asString, asNumber } from '@/lib/apiHelpers'
import { mapAdminLicense } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const statusVariant = {
  active: 'success',
  suspended: 'warning',
  expired: 'destructive',
  revoked: 'secondary',
} as const

type LicenseRow = ReturnType<typeof mapAdminLicense>
type Action = 'suspend' | 'activate' | 'revoke' | 'delete' | 'reset_domains' | 'force_logout' | 'reset_installations' | 'regenerate' | 'notify_ready'

type LogRow = {
  id: string
  endpoint: string
  domain: string
  success: boolean
  error_code: string
  status_code: number
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

export default function LicensesManagement() {
  const fetcher = useCallback(() => adminApi.licenses.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminLicense), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const [detail, setDetail] = useState<LicenseRow | null>(null)
  const [actionTarget, setActionTarget] = useState<{ row: LicenseRow; action: Action } | null>(null)
  const [productUrl, setProductUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [extraUsers, setExtraUsers] = useState('0')
  const [extraStudents, setExtraStudents] = useState('0')
  const [limitsBusy, setLimitsBusy] = useState(false)
  const [activity, setActivity] = useState<LogRow[] | null>(null)
  const [history, setHistory] = useState<HistoryRow[] | null>(null)
  const [installations, setInstallations] = useState<InstallationRow[] | null>(null)

  const openDetail = async (row: LicenseRow) => {
    try {
      const response = await adminApi.licenses.get(row.id)
      const mapped = mapAdminLicense(asRecord(response).data ?? response)
      setDetail(mapped)
      setExtraUsers(String(mapped.extra_max_users ?? 0))
      setExtraStudents(String(mapped.extra_max_students ?? 0))
    } catch {
      setDetail(row)
      setExtraUsers(String(row.extra_max_users ?? 0))
      setExtraStudents(String(row.extra_max_students ?? 0))
    }
  }

  const saveLimitExtras = async () => {
    if (!detail) return
    setLimitsBusy(true)
    try {
      const response = await adminApi.licenses.update(detail.id, {
        extra_max_users: Math.max(0, Number(extraUsers) || 0),
        extra_max_students: Math.max(0, Number(extraStudents) || 0),
      })
      const mapped = mapAdminLicense(asRecord(response).data ?? response)
      setDetail(mapped)
      setExtraUsers(String(mapped.extra_max_users ?? 0))
      setExtraStudents(String(mapped.extra_max_students ?? 0))
      toast({ title: 'Limits updated', description: 'Product picks up new totals on the next license check.' })
      await reload()
    } catch (err) {
      toast({ title: 'Could not update limits', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLimitsBusy(false)
    }
  }

  const startAction = (row: LicenseRow, action: Action) => {
    if (action === 'notify_ready') {
      const domain = row.allowed_domains[0] ?? ''
      setProductUrl(domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '')
    } else {
      setProductUrl('')
    }
    setActionTarget({ row, action })
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { row, action } = actionTarget
    setBusy(true)
    try {
      let regeneratedKey: string | null = null
      let notifySummary: string | null = null
      if (action === 'suspend') await adminApi.licenses.suspend(row.id)
      else if (action === 'activate') await adminApi.licenses.activate(row.id)
      else if (action === 'revoke') await adminApi.licenses.revoke(row.id)
      else if (action === 'delete') await adminApi.licenses.delete(row.id)
      else if (action === 'reset_domains') await adminApi.licenses.resetDomains(row.id)
      else if (action === 'force_logout') await adminApi.licenses.forceLogout(row.id)
      else if (action === 'reset_installations') await adminApi.licenses.resetInstallations(row.id)
      else if (action === 'regenerate') {
        const response = await adminApi.licenses.regenerate(row.id)
        const data = asRecord(asRecord(response).data ?? response)
        regeneratedKey = asString(data.license_key) || null
      } else if (action === 'notify_ready') {
        const response = await adminApi.licenses.notifyReady(row.id, {
          product_url: productUrl.trim() || undefined,
        })
        const data = asRecord(asRecord(response).data ?? response)
        const email = asString(data.customer_email) || row.customer_email
        const phone = asString(data.customer_phone)
        notifySummary = phone
          ? `Notified ${email} (email + WhatsApp ${phone})`
          : `Email sent to ${email}. WhatsApp skipped (no phone on customer).`
      }

      const messages: Record<Action, string> = {
        suspend: 'License suspended. Product stops on the next page load.',
        activate:
          'License Active. Product with an existing install restores on the next page load. If still Invalid, use product Restore with this key.',
        revoke: 'License revoked.',
        delete: 'License deleted.',
        reset_domains: 'Domain binding reset.',
        force_logout: 'Product force logout issued.',
        reset_installations: 'All installations revoked. Product must Restore with the license key.',
        regenerate: regeneratedKey
          ? `New key: ${regeneratedKey}. Product must Restore with this key.`
          : 'License key regenerated. Customer must re-activate on the product.',
        notify_ready: notifySummary ?? 'Customer notified: product is ready.',
      }
      toast({ title: messages[action], variant: 'success' })
      setActionTarget(null)
      setProductUrl('')
      if (action === 'delete') {
        setDetail(null)
      } else if (detail?.id === row.id) {
        await openDetail(row)
      }
      await reload()
    } catch (err) {
      toast({ title: 'Action failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const loadActivity = async (row: LicenseRow) => {
    try {
      const response = await adminApi.licenses.activity(row.id)
      setActivity(unwrapList(response).map((item) => {
        const log = asRecord(item)
        return {
          id: asString(log.id),
          endpoint: asString(log.endpoint),
          domain: asString(log.domain, '—'),
          success: Boolean(log.success),
          error_code: asString(log.error_code, '—'),
          status_code: asNumber(log.status_code),
          created_at: asString(log.created_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load API activity', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const loadHistory = async (row: LicenseRow) => {
    try {
      const response = await adminApi.licenses.history(row.id)
      setHistory(unwrapList(response).map((item) => {
        const event = asRecord(item)
        return {
          id: asString(event.id),
          event: asString(event.event),
          created_at: asString(event.created_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load license history', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const loadInstallations = async (row: LicenseRow) => {
    try {
      const response = await adminApi.licenses.installations(row.id)
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

  const revokeInstallation = async (license: LicenseRow, installation: InstallationRow) => {
    setBusy(true)
    try {
      await adminApi.licenses.revokeInstallation(license.id, installation.id)
      toast({ title: 'Installation revoked.', variant: 'success' })
      await loadInstallations(license)
    } catch (err) {
      toast({ title: 'Revoke failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const confirmMessages: Record<Action, { title: string; description: string }> = {
    suspend: {
      title: 'Suspend License',
      description:
        'SoftKatta will reject the product on the next page load / API call (usually immediate). Install tokens are kept so Activate restores access without a new Restore key when an installation already exists.',
    },
    activate: {
      title: 'Activate License',
      description:
        'Marks this license Active on SoftKatta. If the product already has a live installation, it restores on the next page load. If there is no installation (wipe / new key / reset installations), open the product → Restore access and enter this license key.',
    },
    revoke: {
      title: 'Revoke License',
      description: 'Permanently revokes the license and kills all install sessions. Customer must re-activate with a new key.',
    },
    delete: {
      title: 'Delete License',
      description: 'This will permanently delete the license record. This cannot be undone.',
    },
    reset_domains: {
      title: 'Reset Domain Binding',
      description: 'All registered domains and install tokens will be cleared. Customer must re-activate on the product Restore page.',
    },
    force_logout: {
      title: 'Force Logout Product',
      description: 'Installed products will be forced to re-validate this license on next request.',
    },
    reset_installations: {
      title: 'Reset Installations',
      description: 'All install tokens will be revoked. Products must activate again.',
    },
    regenerate: {
      title: 'Regenerate License Key',
      description: 'Creates a new license key string. The old key stops working immediately, domains and install sessions are cleared, and the customer must activate the product again with the new key.',
    },
    notify_ready: {
      title: 'Notify: Product Ready',
      description: 'Send email + WhatsApp to the customer that their product setup is complete. Confirm the live product URL below (optional if a domain is already registered).',
    },
  }

  const columns = [
    {
      key: 'license_key',
      header: 'License Key',
      render: (row: LicenseRow) => (
        <span className="font-mono text-xs text-[var(--brand-blue)]">{row.license_key}</span>
      ),
    },
    { key: 'customer_name', header: 'Customer', render: (row: LicenseRow) => (
      <div>
        <div className="font-medium">{row.customer_name}</div>
        <div className="text-xs text-[var(--muted-foreground)]">{row.customer_email}</div>
      </div>
    ) },
    { key: 'product_name', header: 'Product' },
    {
      key: 'allowed_domains',
      header: 'Domains',
      render: (row: LicenseRow) =>
        row.allowed_domains.length > 0
          ? row.allowed_domains.join(', ')
          : <span className="text-xs text-[var(--muted-foreground)]">Not registered</span>,
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
      key: 'expires_at',
      header: 'Expires',
      render: (row: LicenseRow) =>
        row.expires_at ? formatDate(row.expires_at) : <span className="text-[var(--muted-foreground)] text-xs">Lifetime</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[180px] text-right',
      render: (row: LicenseRow) => (
        <TableActions
          actions={[
            actionBtn('View', Eye, () => openDetail(row)),
            actionBtn('Product Ready', Megaphone, () => startAction(row, 'notify_ready')),
            row.status !== 'active'
              ? actionBtn('Activate', ShieldCheck, () => startAction(row, 'activate'))
              : actionBtn('Suspend', ShieldOff, () => startAction(row, 'suspend')),
            actionBtn('Reset Domains', RotateCcw, () => startAction(row, 'reset_domains')),
            actionBtn('Regenerate Key', RefreshCw, () => startAction(row, 'regenerate')),
            actionBtn('Force Logout', LogOut, () => startAction(row, 'force_logout')),
            { ...actionBtn('Revoke', XCircle, () => startAction(row, 'revoke')), variant: 'destructive' },
            { ...actionBtn('Delete', Trash2, () => startAction(row, 'delete')), variant: 'destructive' },
          ]}
        />
      ),
    },
  ]

  return (
    <PortalPageShell
      eyebrow="Licenses"
      heroTitle="License Keys"
      heroDescription="Search and control every customer license, domain binding, and product session."
      title="License Keys"
      description="Search by license key, domain, or customer. Suspend, reset domains, or force logout."
      loading={loading}
      error={error}
    >
      <DataTable
        embedded
        columns={columns}
        data={items}
        pageSize={10}
        searchKeys={['license_key', 'product_name', 'customer_name', 'customer_email', 'status', 'domains_text']}
        searchPlaceholder="Search by license key, domain, or customer..."
        emptyTitle="No license keys found"
        emptyDescription="License records will appear here after purchases are processed."
      />

      <DetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title="License Details"
        description="Full license, customer, domain, and product integration details."
      >
        {detail && (
          <>
            <DetailRow label="License Key" value={<span className="font-mono text-xs break-all text-[var(--brand-blue)] select-all">{detail.license_key}</span>} />
            <DetailRow label="Status" value={<Badge variant={statusVariant[detail.status as keyof typeof statusVariant] ?? 'secondary'}>{detail.status}</Badge>} />
            <DetailRow label="Customer" value={detail.customer_name} />
            <DetailRow label="Customer Email" value={detail.customer_email} />
            <DetailRow label="Product" value={detail.product_name} />
            <DetailRow label="Plan" value={detail.plan_name} />
            <DetailRow label="Plan max users" value={String(detail.plan_max_users ?? '—')} />
            <DetailRow label="Plan max students" value={String(detail.plan_max_students ?? '—')} />
            <DetailRow
              label="Complimentary extra users"
              value={
                <Input
                  type="number"
                  min={0}
                  value={extraUsers}
                  onChange={(e) => setExtraUsers(e.target.value)}
                  className="h-8 w-28 bg-[var(--input-background)]"
                />
              }
            />
            <DetailRow
              label="Complimentary extra students"
              value={
                <Input
                  type="number"
                  min={0}
                  value={extraStudents}
                  onChange={(e) => setExtraStudents(e.target.value)}
                  className="h-8 w-28 bg-[var(--input-background)]"
                />
              }
            />
            <DetailRow
              label="Effective totals"
              value={`Users ${detail.effective_max_users ?? '—'} · Students ${detail.effective_max_students ?? '—'}`}
            />
            <div className="pt-1">
              <Button type="button" size="sm" onClick={() => void saveLimitExtras()} disabled={limitsBusy}>
                {limitsBusy ? 'Saving…' : 'Save complimentary extras'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Customers normally buy paid extras from Client → Licenses. Use this only for SoftKatta comps.
              </p>
            </div>
            <DetailRow label="API URL" value={<span className="font-mono text-xs break-all select-all">{detail.api_url || '—'}</span>} />
            <DetailRow label="API Key" value={<span className="font-mono text-xs break-all select-all">{detail.api_key || '—'}</span>} />
            <DetailRow label="Product Slug" value={<span className="font-mono text-xs select-all">{detail.product_slug || '—'}</span>} />
            <DetailRow label="Product Version" value={<span className="font-mono text-xs select-all">{detail.product_version || '—'}</span>} />
            <DetailRow label="Max Domains" value={String(detail.max_domains ?? 1)} />
            <DetailRow label="Max Devices" value={String(detail.max_devices)} />
            <DetailRow label="Activation Count" value={String(detail.activation_count)} />
            <DetailRow
              label="Registered Domains"
              value={
                detail.allowed_domains.length > 0
                  ? detail.allowed_domains.join(', ')
                  : <span className="text-[var(--muted-foreground)] text-xs">No domain registered</span>
              }
            />
            <DetailRow label="Activated At" value={detail.activated_at ? formatDate(detail.activated_at) : '—'} />
            <DetailRow label="Expires At" value={detail.expires_at ? formatDate(detail.expires_at) : 'Lifetime'} />
            <DetailRow label="Last Verified" value={detail.last_verified_at ? formatDate(detail.last_verified_at) : '—'} />
            {detail.revoke_reason && <DetailRow label="Revoke Reason" value={detail.revoke_reason} />}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => loadActivity(detail)}>
                <Activity className="mr-1 h-4 w-4" /> API Activity
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => loadHistory(detail)}>
                <History className="mr-1 h-4 w-4" /> License History
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => loadInstallations(detail)}>
                <Server className="mr-1 h-4 w-4" /> Installations
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'notify_ready')}>
                <Megaphone className="mr-1 h-4 w-4" /> Product Ready
              </Button>
              {detail.status === 'active' ? (
                <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'suspend')}>
                  <ShieldOff className="mr-1 h-4 w-4" /> Suspend
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'activate')}>
                  <ShieldCheck className="mr-1 h-4 w-4" /> Activate
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'reset_domains')}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset Domains
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'regenerate')}>
                <RefreshCw className="mr-1 h-4 w-4" /> Regenerate Key
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'reset_installations')}>
                <Server className="mr-1 h-4 w-4" /> Reset Installations
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => startAction(detail, 'force_logout')}>
                <LogOut className="mr-1 h-4 w-4" /> Force Logout
              </Button>
            </div>
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
                  {row.domain} · {row.success ? 'OK' : row.error_code} · {row.status_code}
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
              <DetailRow label="Status" value={row.revoked_at ? `Revoked ${formatDate(row.revoked_at)}` : 'Active'} />
              {!row.revoked_at && detail && (
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => revokeInstallation(detail, row)}>
                  Revoke Token
                </Button>
              )}
            </div>
          ))
        )}
      </DetailDialog>

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null)
            setProductUrl('')
          }
        }}
        onConfirm={handleAction}
        loading={busy}
        title={actionTarget ? confirmMessages[actionTarget.action].title : ''}
        description={actionTarget ? confirmMessages[actionTarget.action].description : ''}
        confirmLabel={
          actionTarget?.action === 'notify_ready'
            ? 'Send email + WhatsApp'
            : actionTarget?.action === 'delete' || actionTarget?.action === 'revoke'
              ? 'Confirm'
              : 'Proceed'
        }
        confirmVariant={
          actionTarget?.action === 'delete' || actionTarget?.action === 'revoke' ? 'destructive' : 'default'
        }
      >
        {actionTarget?.action === 'notify_ready' && (
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="product-ready-url">
              Product URL (optional)
            </label>
            <Input
              id="product-ready-url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://customer-domain.com"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Customer: {actionTarget.row.customer_name} · {actionTarget.row.customer_email}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </PortalPageShell>
  )
}
