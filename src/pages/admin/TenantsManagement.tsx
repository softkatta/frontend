import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminTenant } from '@/lib/apiMappers'
import { slugify } from '@/lib/slug'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type TenantRow = ReturnType<typeof mapAdminTenant>
type CustomerOption = { id: string; label: string }
type SubscriptionOption = {
  id: string
  product_id: string
  label: string
  product_name: string
  plan_name: string
}
type ProductOption = { id: string; name: string }
type PlanOption = { id: string; product_id: string; name: string; billing_cycle: string }
type DomainAssignment = {
  key: string
  subscription_id?: string
  plan_id?: string
  product_id: string
  product_name: string
  plan_name: string
  frontend_domain: string
  backend_domain: string
}

type TenantFormValues = {
  name: string
  slug: string
  owner_id: string
  domain_assignments: DomainAssignment[]
  status: 'active' | 'suspended' | 'inactive'
}

const EMPTY_FORM: TenantFormValues = {
  name: '',
  slug: '',
  owner_id: '',
  domain_assignments: [],
  status: 'active',
}

function newAssignmentKey() {
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function TenantFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: TenantFormValues | null
  saving?: boolean
  onSubmit: (values: TenantFormValues) => void | Promise<void>
}) {
  const [form, setForm] = useState<TenantFormValues>(initial ?? EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing')
  const [addSubscriptionId, setAddSubscriptionId] = useState('')
  const [addProductId, setAddProductId] = useState('')
  const [addPlanId, setAddPlanId] = useState('')
  const [addFrontend, setAddFrontend] = useState('')
  const [addBackend, setAddBackend] = useState('')
  const isEdit = Boolean(initial)

  const resetAddDialog = () => {
    setAddSubscriptionId('')
    setAddProductId('')
    setAddPlanId('')
    setAddFrontend('')
    setAddBackend('')
  }

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM)
    setAutoSlug(!Boolean(initial?.slug))
    setAddOpen(false)
    resetAddDialog()
  }, [initial, open])

  useEffect(() => {
    if (!open) return
    void adminApi.users.list({ role: 'client', per_page: 200 }).then((res) => {
      setCustomers(
        unwrapList(res).map((row) => {
          const user = asRecord(row)
          const name = asString(user.name, 'Customer')
          const email = asString(user.email)
          return { id: asString(user.id), label: email ? `${name} (${email})` : name }
        }),
      )
    }).catch(() => setCustomers([]))

    void Promise.all([adminApi.products.list(), adminApi.plans.list()]).then(([productRes, planRes]) => {
      setProducts(
        unwrapList(productRes).map((row) => {
          const item = asRecord(row)
          return { id: asString(item.id), name: asString(item.name, 'Product') }
        }),
      )
      setPlans(
        unwrapList(planRes).map((row) => {
          const item = asRecord(row)
          return {
            id: asString(item.id),
            product_id: asString(item.product_id),
            name: asString(item.name, asString(item.billing_cycle, 'plan')),
            billing_cycle: asString(item.billing_cycle, 'monthly'),
          }
        }),
      )
    }).catch(() => {
      setProducts([])
      setPlans([])
    })
  }, [open])

  useEffect(() => {
    if (!open || !form.owner_id) {
      setSubscriptions([])
      return
    }
    void adminApi.subscriptions.list({ user_id: form.owner_id, per_page: 100 }).then((res) => {
      setSubscriptions(
        unwrapList(res).map((row) => {
          const item = asRecord(row)
          const product = asRecord(item.product)
          const plan = asRecord(item.plan)
          const productName = asString(product.name, 'Product')
          const planName = asString(plan.name, asString(plan.billing_cycle, 'plan'))
          const id = asString(item.id)
          return {
            id,
            product_id: asString(item.product_id || product.id),
            product_name: productName,
            plan_name: planName,
            label: `#${id} · ${productName} · ${planName}`,
          }
        }),
      )
    }).catch(() => setSubscriptions([]))
  }, [open, form.owner_id])

  const availableSubscriptions = useMemo(() => {
    const used = new Set(
      form.domain_assignments
        .map((row) => row.subscription_id)
        .filter((id): id is string => Boolean(id)),
    )
    return subscriptions.filter((row) => !used.has(row.id))
  }, [subscriptions, form.domain_assignments])

  const plansForProduct = useMemo(
    () => plans.filter((plan) => plan.product_id === addProductId),
    [plans, addProductId],
  )

  useEffect(() => {
    if (!addOpen) return
    setAddMode(availableSubscriptions.length > 0 ? 'existing' : 'new')
  }, [addOpen, availableSubscriptions.length])

  const update = (patch: Partial<TenantFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.name !== undefined) {
        next.slug = slugify(patch.name)
      }
      if (patch.owner_id !== undefined && patch.owner_id !== prev.owner_id) {
        next.domain_assignments = []
      }
      return next
    })
  }

  const removeAssignment = (key: string) => {
    setForm((prev) => ({
      ...prev,
      domain_assignments: prev.domain_assignments.filter((row) => row.key !== key),
    }))
  }

  const submitAddDomain = () => {
    if (!addFrontend.trim() || !addBackend.trim()) return

    if (addMode === 'existing') {
      const selected = subscriptions.find((row) => row.id === addSubscriptionId)
      if (!selected) return
      setForm((prev) => ({
        ...prev,
        domain_assignments: [
          ...prev.domain_assignments,
          {
            key: newAssignmentKey(),
            subscription_id: selected.id,
            product_id: selected.product_id,
            product_name: selected.product_name,
            plan_name: selected.plan_name,
            frontend_domain: addFrontend.trim(),
            backend_domain: addBackend.trim(),
          },
        ],
      }))
    } else {
      const product = products.find((row) => row.id === addProductId)
      const plan = plans.find((row) => row.id === addPlanId)
      if (!product || !plan) return
      setForm((prev) => ({
        ...prev,
        domain_assignments: [
          ...prev.domain_assignments,
          {
            key: newAssignmentKey(),
            product_id: product.id,
            plan_id: plan.id,
            product_name: product.name,
            plan_name: plan.name,
            frontend_domain: addFrontend.trim(),
            backend_domain: addBackend.trim(),
          },
        ],
      }))
    }

    setAddOpen(false)
    resetAddDialog()
  }

  const canAddDomains = Boolean(form.owner_id) && (availableSubscriptions.length > 0 || products.length > 0)
  const canSubmitAdd =
    Boolean(addFrontend.trim() && addBackend.trim()) &&
    (addMode === 'existing'
      ? Boolean(addSubscriptionId)
      : Boolean(addProductId && addPlanId))
  const canSubmit = form.name.trim() && form.owner_id

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit tenant' : 'Add tenant'}</DialogTitle>
            <DialogDescription>
              Add domains per purchase with +. If the customer has no subscription yet, pick a product and plan — it is created on save.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!canSubmit) return
              void onSubmit({
                ...form,
                name: form.name.trim(),
                slug: form.slug.trim(),
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="tenant-customer">Customer *</Label>
              <Select
                value={form.owner_id || undefined}
                onValueChange={(value) => update({ owner_id: value })}
              >
                <SelectTrigger id="tenant-customer" className="bg-[var(--input-background)]">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-name">Name *</Label>
              <Input
                id="tenant-name"
                value={form.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Acme Workspace"
                required
                className="bg-[var(--input-background)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-slug">Slug</Label>
                <Input
                  id="tenant-slug"
                  value={form.slug}
                  onChange={(event) => {
                    setAutoSlug(false)
                    update({ slug: event.target.value })
                  }}
                  placeholder="acme-workspace"
                  className="bg-[var(--input-background)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-status">Status</Label>
                <select
                  id="tenant-status"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TenantFormValues['status'] }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Product domains</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    One entry per purchase. Same product bought twice → add twice → two license keys.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1 rounded-xl"
                  disabled={!canAddDomains}
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              {form.domain_assignments.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {form.owner_id
                    ? (subscriptions.length === 0
                      ? 'No purchases yet — click + and choose a product + plan, then enter domains.'
                      : 'No domains yet. Click + to select a product purchase and add domains.')
                    : 'Select a customer first.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {form.domain_assignments.map((row) => (
                    <div key={row.key} className="rounded-lg bg-[var(--muted)]/30 p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{row.product_name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {row.subscription_id
                              ? `Subscription #${row.subscription_id} · ${row.plan_name}`
                              : `New purchase · ${row.plan_name}`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeAssignment(row.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-[var(--muted-foreground)]">Frontend</span>
                          <p className="font-medium">{row.frontend_domain}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Backend</span>
                          <p className="font-medium">{row.backend_domain}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving || !canSubmit}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add tenant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add product domains</DialogTitle>
            <DialogDescription>
              Use an existing purchase, or create a new product + plan purchase with these domains.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(availableSubscriptions.length > 0 || products.length > 0) && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={addMode === 'existing' ? 'default' : 'outline'}
                  className="rounded-xl"
                  disabled={availableSubscriptions.length === 0}
                  onClick={() => setAddMode('existing')}
                >
                  Existing purchase
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addMode === 'new' ? 'default' : 'outline'}
                  className="rounded-xl"
                  disabled={products.length === 0}
                  onClick={() => setAddMode('new')}
                >
                  New purchase
                </Button>
              </div>
            )}

            {addMode === 'existing' ? (
              <div className="space-y-2">
                <Label>Product / subscription *</Label>
                <Select value={addSubscriptionId || undefined} onValueChange={setAddSubscriptionId}>
                  <SelectTrigger className="bg-[var(--input-background)]">
                    <SelectValue placeholder="Select purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubscriptions.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select
                    value={addProductId || undefined}
                    onValueChange={(value) => {
                      setAddProductId(value)
                      setAddPlanId('')
                    }}
                  >
                    <SelectTrigger className="bg-[var(--input-background)]">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan *</Label>
                  <Select
                    value={addPlanId || undefined}
                    onValueChange={setAddPlanId}
                    disabled={!addProductId}
                  >
                    <SelectTrigger className="bg-[var(--input-background)]">
                      <SelectValue placeholder={addProductId ? 'Select plan' : 'Select product first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {plansForProduct.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name} ({row.billing_cycle})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Frontend domain *</Label>
              <Input
                value={addFrontend}
                onChange={(event) => setAddFrontend(event.target.value)}
                placeholder="kinder.softkatta.in"
                className="bg-[var(--input-background)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Backend domain *</Label>
              <Input
                value={addBackend}
                onChange={(event) => setAddBackend(event.target.value)}
                placeholder="kinder-api.softkatta.in"
                className="bg-[var(--input-background)]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!canSubmitAdd}
              onClick={submitAddDomain}
            >
              Add domains
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function TenantsManagement() {
  const fetcher = useCallback(() => adminApi.tenants.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminTenant), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const [detail, setDetail] = useState<TenantRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null)
  const [editInitial, setEditInitial] = useState<TenantFormValues | null>(null)
  const [pendingDomains, setPendingDomains] = useState<Array<{
    tenant_id: string
    tenant_name: string
    owner_name: string
    owner_email: string
    subscription_id: string
    product_name: string
    plan_name: string
    frontend_domain: string
    backend_domain: string
    submitted_at: string
  }>>([])
  const [reviewingKey, setReviewingKey] = useState<string | null>(null)

  const loadPendingDomains = useCallback(async () => {
    try {
      const res = await adminApi.tenants.pendingDomains()
      setPendingDomains(
        unwrapList(res).map((row) => {
          const item = asRecord(row)
          return {
            tenant_id: asString(item.tenant_id),
            tenant_name: asString(item.tenant_name, 'Tenant'),
            owner_name: asString(item.owner_name),
            owner_email: asString(item.owner_email),
            subscription_id: asString(item.subscription_id),
            product_name: asString(item.product_name, 'Product'),
            plan_name: asString(item.plan_name, 'plan'),
            frontend_domain: asString(item.frontend_domain),
            backend_domain: asString(item.backend_domain),
            submitted_at: asString(item.submitted_at),
          }
        }),
      )
    } catch {
      setPendingDomains([])
    }
  }, [])

  useEffect(() => {
    void loadPendingDomains()
  }, [loadPendingDomains])

  const reviewPending = async (row: (typeof pendingDomains)[number], action: 'approve' | 'reject') => {
    const key = `${row.tenant_id}-${row.subscription_id}-${action}`
    setReviewingKey(key)
    try {
      if (action === 'approve') {
        await adminApi.tenants.approvePendingDomain(row.tenant_id, row.subscription_id)
        toast({ title: 'Domains approved', description: `${row.product_name} — license will generate if eligible.`, variant: 'success' })
      } else {
        const reason = window.prompt('Rejection reason (optional)', 'Please update your domains and resubmit.') || undefined
        await adminApi.tenants.rejectPendingDomain(row.tenant_id, row.subscription_id, { reason })
        toast({ title: 'Request rejected', description: 'Customer can resubmit domains.', variant: 'success' })
      }
      await Promise.all([reload(), loadPendingDomains()])
    } catch (err) {
      toast({ title: 'Review failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setReviewingKey(null)
    }
  }

  const openCreate = () => {
    setEditingTenant(null)
    setEditInitial(null)
    setFormOpen(true)
  }

  const openEdit = async (tenant: TenantRow) => {
    setEditingTenant(tenant)
    setFormOpen(true)

    let labelBySubscription = new Map<string, { product_name: string; plan_name: string; product_id: string }>()
    if (tenant.owner_id) {
      try {
        const res = await adminApi.subscriptions.list({ user_id: tenant.owner_id, per_page: 100 })
        labelBySubscription = new Map(
          unwrapList(res).map((row) => {
            const item = asRecord(row)
            const product = asRecord(item.product)
            const plan = asRecord(item.plan)
            return [
              asString(item.id),
              {
                product_id: asString(item.product_id || product.id),
                product_name: asString(product.name, 'Product'),
                plan_name: asString(plan.name, 'plan'),
              },
            ] as const
          }),
        )
      } catch {
        // keep empty labels
      }
    }

    setEditInitial({
      name: tenant.name,
      slug: tenant.slug,
      owner_id: tenant.owner_id,
      status: tenant.status as TenantFormValues['status'],
      domain_assignments: tenant.subscription_domains.map((row) => {
        const meta = labelBySubscription.get(row.subscription_id)
        return {
          key: newAssignmentKey(),
          subscription_id: row.subscription_id,
          product_id: row.product_id || meta?.product_id || '',
          product_name: meta?.product_name || 'Product',
          plan_name: meta?.plan_name || 'plan',
          frontend_domain: row.frontend_domain,
          backend_domain: row.backend_domain,
        }
      }),
    })
  }

  const handleSave = async (values: TenantFormValues) => {
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        owner_id: Number(values.owner_id) || values.owner_id,
        status: values.status,
        subscription_domains: values.domain_assignments.map((row) => ({
          subscription_id: row.subscription_id ? Number(row.subscription_id) : undefined,
          product_id: Number(row.product_id) || undefined,
          plan_id: row.plan_id ? Number(row.plan_id) : undefined,
          frontend_domain: row.frontend_domain,
          backend_domain: row.backend_domain,
        })),
      }

      if (editingTenant) {
        await adminApi.tenants.update(editingTenant.id, payload)
        toast({ title: 'Tenant updated', description: 'Domains saved — license keys generated/synced per purchase.', variant: 'success' })
      } else {
        await adminApi.tenants.create(payload)
        toast({ title: 'Tenant created', description: 'Domains saved — license keys generated per purchase.', variant: 'success' })
      }

      setFormOpen(false)
      setEditingTenant(null)
      setEditInitial(null)
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
      await adminApi.tenants.delete(deleteTarget.id)
      toast({ title: 'Tenant deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) {
        setDetail(null)
      }
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
        eyebrow="Workspace"
        heroTitle="Tenants"
        heroDescription="Assign domains per product purchase, or approve customer-submitted domain requests."
        title="Tenants"
        description="Create and manage platform workspaces"
        actions={
          <Button onClick={openCreate} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" /> Add Tenant
          </Button>
        }
        loading={loading}
        error={error}
      >
        {pendingDomains.length > 0 && (
          <div className="mb-4 space-y-3 rounded-xl border border-[var(--border)] p-4">
            <div>
              <p className="text-sm font-medium">Pending customer domain requests</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Approve to save domains and generate license keys. Reject to ask the customer to resubmit.
              </p>
            </div>
            <div className="space-y-2">
              {pendingDomains.map((row) => {
                const approveKey = `${row.tenant_id}-${row.subscription_id}-approve`
                const rejectKey = `${row.tenant_id}-${row.subscription_id}-reject`
                return (
                  <div key={`${row.tenant_id}-${row.subscription_id}`} className="rounded-lg bg-[var(--muted)]/30 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{row.product_name} · {row.plan_name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {row.owner_name || 'Customer'}{row.owner_email ? ` (${row.owner_email})` : ''} · {row.tenant_name}
                        </p>
                        <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                          <p><span className="text-[var(--muted-foreground)]">Frontend:</span> {row.frontend_domain}</p>
                          <p><span className="text-[var(--muted-foreground)]">Backend:</span> {row.backend_domain}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-xl"
                          disabled={Boolean(reviewingKey)}
                          onClick={() => void reviewPending(row, 'approve')}
                        >
                          {reviewingKey === approveKey ? 'Approving…' : 'Approve'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled={Boolean(reviewingKey)}
                          onClick={() => void reviewPending(row, 'reject')}
                        >
                          {reviewingKey === rejectKey ? 'Rejecting…' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DataTable
          embedded
          searchKeys={['name', 'slug', 'owner_name', 'owner_email']}
          searchPlaceholder="Search tenants..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'name', header: 'Tenant', className: 'font-medium' },
            { key: 'slug', header: 'Slug' },
            {
              key: 'owner_name',
              header: 'Customer',
              render: (tenant) => tenant.owner_name || tenant.owner_email || '—',
            },
            {
              key: 'subscription_domains',
              header: 'Domain sets',
              render: (tenant) => String(tenant.subscription_domains.length || 0),
            },
            {
              key: 'status',
              header: 'Status',
              render: (tenant) => {
                if (tenant.status === 'active') {
                  return <Badge variant="success">Active</Badge>
                }
                if (tenant.status === 'suspended') {
                  return <Badge variant="warning">Suspended</Badge>
                }
                return <Badge variant="secondary">Inactive</Badge>
              },
            },
            { key: 'created_at', header: 'Created', render: (tenant) => formatDate(tenant.created_at) },
            {
              key: 'actions',
              header: 'Actions',
              className: 'w-[120px] text-right',
              render: (tenant) => (
                <TableActions actions={[
                  actionBtn('View tenant', Eye, () => setDetail(tenant)),
                  actionBtn('Edit tenant', Pencil, () => { void openEdit(tenant) }),
                  { ...actionBtn('Delete tenant', Trash2, () => setDeleteTarget(tenant)), variant: 'destructive' },
                ]} />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Tenant details">
        {detail && (
          <>
            <DetailRow label="Tenant" value={detail.name} />
            <DetailRow label="Slug" value={detail.slug || '—'} />
            <DetailRow label="Customer" value={detail.owner_name || detail.owner_email || '—'} />
            <DetailRow label="Customer Email" value={detail.owner_email || '—'} />
            <DetailRow
              label="Subscription domains"
              value={
                detail.subscription_domains.length
                  ? detail.subscription_domains
                    .map((row) => `#${row.subscription_id}: ${row.frontend_domain} / ${row.backend_domain}`)
                    .join(' · ')
                  : '—'
              }
            />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Created" value={formatDate(detail.created_at)} />
          </>
        )}
      </DetailDialog>

      <TenantFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingTenant(null)
            setEditInitial(null)
          }
        }}
        initial={editInitial}
        saving={saving}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete tenant?"
        description={deleteTarget ? `This will permanently remove ${deleteTarget.name}.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
