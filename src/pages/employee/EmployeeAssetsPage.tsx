import { useCallback, useEffect, useState } from 'react'
import { Laptop } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type AssetRow = {
  id: string
  asset_tag: string
  name: string
  category: string
  brand: string
  model: string
  serial_number: string
  status: string
  condition: string
  assigned_at: string
  notes: string
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'assigned') return 'default'
  if (status === 'maintenance') return 'secondary'
  return 'outline'
}

export default function EmployeeAssetsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AssetRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.assets.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          asset_tag: asString(row.asset_tag),
          name: asString(row.name),
          category: asString(row.category) || 'other',
          brand: asString(row.brand),
          model: asString(row.model),
          serial_number: asString(row.serial_number),
          status: asString(row.status) || 'assigned',
          condition: asString(row.condition) || 'good',
          assigned_at: asString(row.assigned_at),
          notes: asString(row.notes),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load assets', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Company equipment"
        title="My assets"
        description="Hardware and accessories currently assigned to you."
        aside={rows.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <span className="font-semibold">{rows.length}</span> assigned
          </div>
        ) : undefined}
      />

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Laptop className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 font-medium">No assets assigned</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                When HR assigns a laptop, phone, or ID card to you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{row.asset_tag}</p>
                    </div>
                    <Badge variant={statusVariant(row.status)} className="capitalize shrink-0">
                      {row.status}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--muted-foreground)]">Category</dt>
                      <dd className="capitalize">{row.category.replace(/_/g, ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--muted-foreground)]">Condition</dt>
                      <dd className="capitalize">{row.condition}</dd>
                    </div>
                    {(row.brand || row.model) ? (
                      <div className="col-span-2">
                        <dt className="text-xs text-[var(--muted-foreground)]">Brand / model</dt>
                        <dd>{[row.brand, row.model].filter(Boolean).join(' · ')}</dd>
                      </div>
                    ) : null}
                    {row.serial_number ? (
                      <div className="col-span-2">
                        <dt className="text-xs text-[var(--muted-foreground)]">Serial</dt>
                        <dd className="font-mono text-xs">{row.serial_number}</dd>
                      </div>
                    ) : null}
                    {row.assigned_at ? (
                      <div className="col-span-2">
                        <dt className="text-xs text-[var(--muted-foreground)]">Assigned</dt>
                        <dd>{formatDate(row.assigned_at)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {row.notes ? (
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">{row.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </PortalPanel>
    </PortalPage>
  )
}
