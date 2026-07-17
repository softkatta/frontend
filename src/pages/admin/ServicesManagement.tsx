import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { ServiceFormDialog, type ServiceFormValues } from '@/components/admin/ServiceFormDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminService } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { clearPublicServicesCache } from '@/hooks/usePublicServices'
import { notifySiteConfigUpdated } from '@/lib/siteConfigEvents'
import { useListData } from '@/hooks/useListData'

type ServiceRow = ReturnType<typeof mapAdminService>

function servicePayload(values: ServiceFormValues) {
  const bullets = values.bullets
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description || undefined,
    body: values.body || undefined,
    bullets_heading: values.bullets_heading || undefined,
    bullets: bullets.length > 0 ? bullets : undefined,
    meta_title: values.meta_title || undefined,
    meta_description: values.meta_description || undefined,
    icon: values.icon || undefined,
    image: values.image || undefined,
    is_active: values.is_active,
    sort_order: values.sort_order,
  }
}

export default function ServicesManagement() {
  const fetcher = useCallback(() => adminApi.services.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminService), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<ServiceRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ServiceRow | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  const openEdit = (service: ServiceRow) => {
    setEditTarget(service)
    setFormOpen(true)
  }

  const editValues: ServiceFormValues | null = editTarget
    ? {
        name: editTarget.name,
        slug: editTarget.slug,
        description: editTarget.description,
        body: editTarget.body ?? '',
        bullets_heading: editTarget.bullets_heading ?? '',
        bullets: (editTarget.bullets ?? []).join('\n'),
        meta_title: editTarget.meta_title ?? '',
        meta_description: editTarget.meta_description ?? '',
        icon: editTarget.icon,
        image: editTarget.image ?? '',
        is_active: editTarget.is_active,
        sort_order: editTarget.sort_order,
      }
    : null

  const handleSave = async (values: ServiceFormValues) => {
    setSaving(true)
    try {
      const payload = servicePayload(values)
      if (editTarget) {
        await adminApi.services.update(editTarget.id, payload)
        toast({ title: 'Service updated', description: values.name, variant: 'success' })
      } else {
        await adminApi.services.create(payload)
        toast({ title: 'Service created', description: values.name, variant: 'success' })
      }
      setFormOpen(false)
      setEditTarget(null)
      clearPublicServicesCache()
      notifySiteConfigUpdated('content')
      await reload()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.services.delete(deleteTarget.id)
      toast({ title: 'Service deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
      clearPublicServicesCache()
      notifySiteConfigUpdated('content')
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
        eyebrow="Website"
        heroTitle="Services"
        heroDescription="Manage professional services shown on the public website and homepage."
        title="Services Management"
        description="Add, edit, and publish services with images and icons."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2 rounded-xl">
              <Link to="/services" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View public page
              </Link>
            </Button>
            <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </div>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name', 'slug', 'description', 'icon']}
          searchPlaceholder="Search services..."
          pageSize={8}
          data={items}
          columns={[
            {
              key: 'name',
              header: 'Service',
              render: (row) => (
                <div className="flex items-center gap-3 min-w-0">
                  {row.image_url ? (
                    <img
                      src={row.image_url}
                      alt=""
                      className="h-10 w-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-14 rounded-lg bg-[var(--input)] border border-[var(--border)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.name}</p>
                    <p className="text-xs text-muted-foreground truncate">/services/{row.slug}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'icon',
              header: 'Icon',
              render: (row) => row.icon ? <Badge variant="outline">{row.icon}</Badge> : '—',
            },
            {
              key: 'sort_order',
              header: 'Order',
              className: 'w-20',
            },
            {
              key: 'is_active',
              header: 'Status',
              render: (row) => (
                <Badge variant={row.is_active ? 'default' : 'secondary'}>
                  {row.is_active ? 'Active' : 'Hidden'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[120px] text-right',
              render: (row) => (
                <TableActions
                  actions={[
                    actionBtn('View details', Eye, () => setDetail(row)),
                    actionBtn('Edit service', Pencil, () => openEdit(row)),
                    { ...actionBtn('Delete service', Trash2, () => setDeleteTarget(row)), variant: 'destructive' },
                  ]}
                />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditTarget(null)
        }}
        initial={editValues}
        saving={saving}
        onSubmit={handleSave}
      />

      <DetailDialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.name ?? 'Service'}
        description="Public service details"
      >
        {detail && (
          <>
            {detail.image_url && (
              <img
                src={detail.image_url}
                alt={detail.name}
                className="w-full max-h-48 object-cover rounded-xl border border-[var(--border)] mb-4"
              />
            )}
            <DetailRow label="Slug" value={`/services/${detail.slug}`} />
            <DetailRow label="Icon" value={detail.icon || '—'} />
            <DetailRow label="Sort order" value={String(detail.sort_order)} />
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Hidden'} />
            <DetailRow label="Description" value={detail.description || '—'} />
            <DetailRow label="Body" value={detail.body || '—'} />
            <DetailRow label="Bullets heading" value={detail.bullets_heading || '—'} />
            <DetailRow label="Bullets" value={detail.bullets?.length ? detail.bullets.join(', ') : '—'} />
            <DetailRow label="SEO title" value={detail.meta_title || '—'} />
            <DetailRow label="SEO description" value={detail.meta_description || '—'} />
            <Link
              to={`/services/${detail.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-blue)] hover:underline mt-4"
            >
              Open public page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete service?"
        description={deleteTarget ? `"${deleteTarget.name}" will be removed from the website.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
