import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Eye, Plus, RefreshCw, ScrollText, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { unwrapList, getApiErrorMessage, asRecord, asString } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type IntegrationRow = {
  id: string
  product_id: string
  name: string
  slug: string
  version: string
  api_base_url: string
  public_api_key: string
  secret_api_key: string
  client_id: string
  client_secret: string
  webhook_secret: string
  status: string
  product_name: string
  last_used_at: string
  created_at: string
}

type ProductOption = { id: string; name: string }

type ApiLogRow = {
  id: string
  endpoint: string
  domain: string
  product_slug: string
  success: boolean
  error_code: string
  created_at: string
  license_key: string
  customer: string
}

type DomainResetRow = {
  id: string
  status: string
  reason: string
  created_at: string
  license_key: string
  customer: string
  product: string
}

type ViewTab = 'integrations' | 'api_logs' | 'domain_resets'

function mapIntegration(raw: unknown): IntegrationRow {
  const item = asRecord(raw)
  return {
    id: asString(item.id),
    product_id: asString(item.product_id),
    name: asString(item.name),
    slug: asString(item.slug),
    version: asString(item.version, '1.0.0'),
    api_base_url: asString(item.api_base_url),
    public_api_key: asString(item.public_api_key),
    secret_api_key: asString(item.secret_api_key),
    client_id: asString(item.client_id),
    client_secret: asString(item.client_secret),
    webhook_secret: asString(item.webhook_secret),
    status: asString(item.status, 'active'),
    product_name: asString(item.product_name, 'Product'),
    last_used_at: asString(item.last_used_at),
    created_at: asString(item.created_at),
  }
}

export default function ProductIntegrationsManagement() {
  const fetcher = useCallback(() => adminApi.productIntegrations.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapIntegration), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const [tab, setTab] = useState<ViewTab>('integrations')
  const [detail, setDetail] = useState<IntegrationRow | null>(null)
  const [guide, setGuide] = useState<Record<string, unknown> | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationRow | null>(null)
  const [apiLogs, setApiLogs] = useState<ApiLogRow[]>([])
  const [domainResets, setDomainResets] = useState<DomainResetRow[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const availableProducts = useMemo(() => {
    const linked = new Set(items.map((item) => item.product_id))
    return products.filter((product) => !linked.has(product.id))
  }, [items, products])

  useEffect(() => {
    void (async () => {
      try {
        const list = unwrapList(await adminApi.products.list()).map((raw) => {
          const item = asRecord(raw)
          return { id: asString(item.id), name: asString(item.name, 'Product') }
        })
        setProducts(list)
      } catch {
        setProducts([])
      }
    })()
  }, [])

  const loadApiLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await adminApi.productIntegrations.apiLogs()
      setApiLogs(unwrapList(response).map((raw) => {
        const item = asRecord(raw)
        const license = asRecord(item.license_key)
        const user = asRecord(license.user)
        return {
          id: asString(item.id),
          endpoint: asString(item.endpoint),
          domain: asString(item.domain, '—'),
          product_slug: asString(item.product_slug),
          success: Boolean(item.success),
          error_code: asString(item.error_code, '—'),
          created_at: asString(item.created_at),
          license_key: asString(license.license_key || asRecord(item.meta).license_key, '—'),
          customer: asString(user.name || user.email, '—'),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load API logs', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLogsLoading(false)
    }
  }

  const loadDomainResets = async () => {
    setLogsLoading(true)
    try {
      const response = await adminApi.productIntegrations.domainResetRequests()
      setDomainResets(unwrapList(response).map((raw) => {
        const item = asRecord(raw)
        const license = asRecord(item.license_key)
        const user = asRecord(item.user)
        const product = asRecord(license.product)
        return {
          id: asString(item.id),
          status: asString(item.status, 'pending'),
          reason: asString(item.reason, '—'),
          created_at: asString(item.created_at),
          license_key: asString(license.license_key, '—'),
          customer: asString(user.name || user.email, '—'),
          product: asString(product.name, '—'),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load domain reset requests', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'api_logs') void loadApiLogs()
    if (tab === 'domain_resets') void loadDomainResets()
  }, [tab])

  const openDetail = async (row: IntegrationRow) => {
    try {
      const response = await adminApi.productIntegrations.get(row.id)
      setDetail(mapIntegration(asRecord(response).data ?? response))
    } catch {
      setDetail(row)
    }
  }

  const handleCreate = async () => {
    if (!selectedProductId) {
      toast({ title: 'Select a product', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const response = await adminApi.productIntegrations.create({ product_id: selectedProductId })
      const created = mapIntegration(asRecord(response).data ?? response)
      toast({ title: 'Integration created', description: 'Keys generated. Secret keys are shown once below.', variant: 'success' })
      setCreateOpen(false)
      setSelectedProductId('')
      await reload()
      setDetail(created)
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerate = async (row: IntegrationRow) => {
    setBusy(true)
    try {
      const response = await adminApi.productIntegrations.regenerateKeys(row.id)
      const updated = mapIntegration(asRecord(response).data ?? response)
      toast({ title: 'Keys regenerated', description: 'Update installed products with the new secrets.', variant: 'success' })
      await reload()
      setDetail(updated)
    } catch (err) {
      toast({ title: 'Regenerate failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const handleToggleStatus = async (row: IntegrationRow) => {
    setBusy(true)
    try {
      await adminApi.productIntegrations.update(row.id, {
        status: row.status === 'active' ? 'inactive' : 'active',
      })
      toast({
        title: row.status === 'active' ? 'Integration deactivated' : 'Integration activated',
        variant: 'success',
      })
      await reload()
      if (detail?.id === row.id) await openDetail(row)
    } catch (err) {
      toast({ title: 'Status update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const handleGuide = async (row: IntegrationRow) => {
    setBusy(true)
    try {
      const response = await adminApi.productIntegrations.guide(row.id)
      setGuide(asRecord(asRecord(response).data ?? response))
    } catch (err) {
      toast({ title: 'Guide failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await adminApi.productIntegrations.delete(deleteTarget.id)
      toast({ title: 'Integration deleted', variant: 'success' })
      setDeleteTarget(null)
      setDetail(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const reviewReset = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(true)
    try {
      await adminApi.productIntegrations.reviewDomainReset(id, { status })
      toast({ title: status === 'approved' ? 'Domain reset approved' : 'Domain reset rejected', variant: 'success' })
      await loadDomainResets()
    } catch (err) {
      toast({ title: 'Review failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const integrationColumns = [
    { key: 'product_name', header: 'Product Name', className: 'font-medium' },
    { key: 'slug', header: 'Product Slug', render: (row: IntegrationRow) => <span className="font-mono text-xs">{row.slug}</span> },
    { key: 'version', header: 'Version' },
    {
      key: 'api_base_url',
      header: 'API Base URL',
      render: (row: IntegrationRow) => <span className="font-mono text-xs break-all">{row.api_base_url}</span>,
    },
    {
      key: 'public_api_key',
      header: 'Public API Key',
      render: (row: IntegrationRow) => <span className="font-mono text-xs break-all">{row.public_api_key}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: IntegrationRow) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>{row.status}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row: IntegrationRow) => row.created_at ? formatDate(row.created_at) : '—',
    },
    {
      key: 'last_used_at',
      header: 'Last Used',
      render: (row: IntegrationRow) => row.last_used_at ? formatDate(row.last_used_at) : '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[180px] text-right',
      render: (row: IntegrationRow) => (
        <TableActions
          actions={[
            actionBtn('View', Eye, () => openDetail(row)),
            actionBtn('Guide', BookOpen, () => handleGuide(row)),
            actionBtn('Regenerate Keys', RefreshCw, () => handleRegenerate(row)),
            row.status === 'active'
              ? actionBtn('Deactivate', ShieldOff, () => handleToggleStatus(row))
              : actionBtn('Activate', ShieldCheck, () => handleToggleStatus(row)),
            { ...actionBtn('Delete', Trash2, () => setDeleteTarget(row)), variant: 'destructive' },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PortalPageShell
        eyebrow="Integrations"
        heroTitle="Product Integrations"
        heroDescription="Manage product API credentials, validation logs, and domain reset requests."
        title="Product Integrations"
        description="Admin-only secrets, guides, API logs, and domain reset approvals."
        loading={tab === 'integrations' ? loading : logsLoading}
        error={error}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant={tab === 'integrations' ? 'default' : 'outline'} onClick={() => setTab('integrations')}>
              Integrations
            </Button>
            <Button variant={tab === 'api_logs' ? 'default' : 'outline'} onClick={() => setTab('api_logs')}>
              <ScrollText className="mr-2 h-4 w-4" />
              API Logs
            </Button>
            <Button variant={tab === 'domain_resets' ? 'default' : 'outline'} onClick={() => setTab('domain_resets')}>
              Domain Resets
            </Button>
            {tab === 'integrations' && (
              <Button onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus className="mr-2 h-4 w-4" />
                Create Integration
              </Button>
            )}
          </div>
        )}
      >
        {tab === 'integrations' && (
          <DataTable
            embedded
            columns={integrationColumns}
            data={items}
            pageSize={10}
            searchKeys={['product_name', 'slug', 'public_api_key', 'status', 'version']}
            searchPlaceholder="Search integrations..."
            emptyTitle="No product integrations yet"
            emptyDescription="Create an integration to generate API credentials for a product."
          />
        )}

        {tab === 'api_logs' && (
          <DataTable
            embedded
            columns={[
              { key: 'created_at', header: 'Time', render: (row: ApiLogRow) => row.created_at ? formatDate(row.created_at) : '—' },
              { key: 'endpoint', header: 'Endpoint' },
              { key: 'product_slug', header: 'Product' },
              { key: 'license_key', header: 'License', render: (row: ApiLogRow) => <span className="font-mono text-xs">{row.license_key}</span> },
              { key: 'customer', header: 'Customer' },
              { key: 'domain', header: 'Domain' },
              {
                key: 'success',
                header: 'Result',
                render: (row: ApiLogRow) => (
                  <Badge variant={row.success ? 'success' : 'destructive'}>
                    {row.success ? 'OK' : row.error_code}
                  </Badge>
                ),
              },
            ]}
            data={apiLogs}
            pageSize={15}
            searchKeys={['endpoint', 'product_slug', 'license_key', 'customer', 'domain', 'error_code']}
            searchPlaceholder="Search API logs by license, domain, or error..."
            emptyTitle="No API logs yet"
            emptyDescription="Validation and heartbeat requests will appear here."
          />
        )}

        {tab === 'domain_resets' && (
          <DataTable
            embedded
            columns={[
              { key: 'created_at', header: 'Requested', render: (row: DomainResetRow) => row.created_at ? formatDate(row.created_at) : '—' },
              { key: 'customer', header: 'Customer' },
              { key: 'product', header: 'Product' },
              { key: 'license_key', header: 'License', render: (row: DomainResetRow) => <span className="font-mono text-xs">{row.license_key}</span> },
              { key: 'reason', header: 'Reason' },
              {
                key: 'status',
                header: 'Status',
                render: (row: DomainResetRow) => (
                  <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'destructive' : 'warning'}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (row: DomainResetRow) => row.status === 'pending' ? (
                  <TableActions
                    actions={[
                      actionBtn('Approve', ShieldCheck, () => reviewReset(row.id, 'approved')),
                      { ...actionBtn('Reject', ShieldOff, () => reviewReset(row.id, 'rejected')), variant: 'destructive' },
                    ]}
                  />
                ) : null,
              },
            ]}
            data={domainResets}
            pageSize={10}
            searchKeys={['customer', 'product', 'license_key', 'status', 'reason']}
            searchPlaceholder="Search domain reset requests..."
            emptyTitle="No domain reset requests"
            emptyDescription="Customer domain reset requests will appear here for approval."
          />
        )}
      </PortalPageShell>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Product Integration</DialogTitle>
            <DialogDescription>
              Select a product. Public key, secret key, client credentials, and webhook secret will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableProducts.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">All products already have integrations.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !selectedProductId}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailDialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)} title="Integration Details">
        {detail && (
          <>
            <DetailRow label="Product Name" value={detail.product_name} />
            <DetailRow label="Product Slug" value={<span className="font-mono text-xs select-all">{detail.slug}</span>} />
            <DetailRow label="Product Version" value={<span className="font-mono text-xs select-all">{detail.version}</span>} />
            <DetailRow label="API Base URL" value={<span className="font-mono text-xs break-all select-all">{detail.api_base_url}</span>} />
            <DetailRow label="Public API Key" value={<span className="font-mono text-xs break-all select-all">{detail.public_api_key}</span>} />
            <DetailRow label="Secret API Key" value={<span className="font-mono text-xs break-all select-all">{detail.secret_api_key}</span>} />
            <DetailRow label="Client ID" value={<span className="font-mono text-xs break-all select-all">{detail.client_id}</span>} />
            <DetailRow label="Client Secret" value={<span className="font-mono text-xs break-all select-all">{detail.client_secret}</span>} />
            <DetailRow label="Webhook Secret" value={<span className="font-mono text-xs break-all select-all">{detail.webhook_secret}</span>} />
            <DetailRow label="Status" value={<Badge variant={detail.status === 'active' ? 'success' : 'secondary'}>{detail.status}</Badge>} />
            <DetailRow label="Created Date" value={detail.created_at ? formatDate(detail.created_at) : '—'} />
            <DetailRow label="Last Used Date" value={detail.last_used_at ? formatDate(detail.last_used_at) : '—'} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleGuide(detail)}>Integration Guide</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleRegenerate(detail)}>Regenerate Keys</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleToggleStatus(detail)}>
                {detail.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </>
        )}
      </DetailDialog>

      <DetailDialog open={!!guide} onOpenChange={(open) => !open && setGuide(null)} title="Integration Guide">
        {guide && (
          <div className="space-y-4 text-sm">
            <DetailRow label="API Base URL" value={asString(guide.api_base_url)} />
            <DetailRow label="Product Slug" value={asString(asRecord(guide.product).slug)} />
            <DetailRow label="Public API Key" value={<span className="font-mono text-xs break-all">{asString(guide.public_api_key)}</span>} />
            <DetailRow label="Authentication" value={asString(asRecord(guide.authentication).method)} />
            <DetailRow
              label="Required Headers"
              value={(Array.isArray(guide.required_headers) ? guide.required_headers : []).join(', ')}
            />
            <DetailRow
              label="Required Endpoints"
              value={(Array.isArray(guide.endpoints) ? guide.endpoints : []).join(', ')}
            />
            <div>
              <p className="mb-2 font-medium">cURL</p>
              <pre className="overflow-x-auto rounded-md bg-[var(--muted)] p-3 text-xs whitespace-pre-wrap">
                {asString(asRecord(guide.examples).curl)}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-medium">Laravel</p>
              <pre className="overflow-x-auto rounded-md bg-[var(--muted)] p-3 text-xs whitespace-pre-wrap">
                {asString(asRecord(guide.examples).laravel)}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-medium">Axios</p>
              <pre className="overflow-x-auto rounded-md bg-[var(--muted)] p-3 text-xs whitespace-pre-wrap">
                {asString(asRecord(guide.examples).axios)}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-medium">Fetch API</p>
              <pre className="overflow-x-auto rounded-md bg-[var(--muted)] p-3 text-xs whitespace-pre-wrap">
                {asString(asRecord(guide.examples).fetch)}
              </pre>
            </div>
            <div>
              <p className="mb-2 font-medium">Error Codes</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {(Array.isArray(guide.error_codes) ? guide.error_codes : []).join(', ')}
              </p>
            </div>
            <div>
              <p className="mb-2 font-medium">Troubleshooting</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--muted-foreground)]">
                {(Array.isArray(guide.troubleshooting) ? guide.troubleshooting : []).map((item) => (
                  <li key={String(item)}>{String(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete Product Integration"
        description="This deletes API credentials for the product. Installed products will stop authenticating."
        confirmLabel="Delete"
      />
    </>
  )
}
