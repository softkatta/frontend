import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminApi } from '@/services/api'
import { asBool, asNumber, asRecord, asString, unwrapList } from '@/lib/apiHelpers'

export type CreateSubscriptionValues = {
  user_id: string
  product_id: string
  plan_id: string
  status: string
  auto_renew: boolean
  apply_trial: boolean
  starts_at: string
  ends_at: string
}

type CustomerOption = { id: string; label: string }
type ProductOption = { id: string; name: string; has_free_trial: boolean }
type PlanOption = { id: string; label: string; product_id: string; billing_cycle: string }

type CreateSubscriptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving?: boolean
  onSubmit: (values: CreateSubscriptionValues) => void | Promise<void>
}

const EMPTY: CreateSubscriptionValues = {
  user_id: '',
  product_id: '',
  plan_id: '',
  status: 'active',
  auto_renew: true,
  apply_trial: false,
  starts_at: new Date().toISOString().slice(0, 10),
  ends_at: '',
}

function defaultEndDate(startsAt: string, billingCycle: string) {
  const base = startsAt ? new Date(startsAt) : new Date()
  if (Number.isNaN(base.getTime())) return ''
  const end = new Date(base)
  if (billingCycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString().slice(0, 10)
}

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  saving,
  onSubmit,
}: CreateSubscriptionDialogProps) {
  const [form, setForm] = useState<CreateSubscriptionValues>(EMPTY)
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])

  useEffect(() => {
    if (!open) return
    setForm(EMPTY)
    void Promise.all([
      adminApi.users.list({ role: 'client' }),
      adminApi.products.list(),
      adminApi.plans.list(),
    ]).then(([usersRes, productsRes, plansRes]) => {
      setCustomers(
        unwrapList(usersRes).map((row) => {
          const user = asRecord(row)
          const name = asString(user.name, 'Customer')
          const email = asString(user.email)
          return { id: asString(user.id), label: email ? `${name} (${email})` : name }
        }),
      )
      setProducts(
        unwrapList(productsRes).map((row) => {
          const product = asRecord(row)
          return {
            id: asString(product.id),
            name: asString(product.name, 'Product'),
            has_free_trial: asBool(product.has_free_trial),
          }
        }),
      )
      setPlans(
        unwrapList(plansRes).map((row) => {
          const plan = asRecord(row)
          const cycle = asString(plan.billing_cycle, 'monthly')
          const price = asNumber(plan.price)
          return {
            id: asString(plan.id),
            product_id: asString(plan.product_id),
            billing_cycle: cycle,
            label: `${cycle} · ₹${price.toLocaleString('en-IN')}`,
          }
        }),
      )
    })
  }, [open])

  const productPlans = useMemo(
    () => plans.filter((plan) => plan.product_id === form.product_id),
    [plans, form.product_id],
  )

  const selectedProduct = products.find((p) => p.id === form.product_id)

  const handleProductChange = (product_id: string) => {
    const nextPlans = plans.filter((plan) => plan.product_id === product_id)
    const firstPlan = nextPlans[0]
    const product = products.find((p) => p.id === product_id)
    setForm((f) => ({
      ...f,
      product_id,
      plan_id: firstPlan?.id ?? '',
      ends_at: firstPlan ? defaultEndDate(f.starts_at, firstPlan.billing_cycle) : '',
      apply_trial: product?.has_free_trial ? f.apply_trial : false,
    }))
  }

  const handlePlanChange = (planId: string) => {
    const plan = productPlans.find((p) => p.id === planId)
    setForm((f) => ({
      ...f,
      plan_id: planId,
      ends_at: defaultEndDate(f.starts_at, plan?.billing_cycle ?? 'monthly'),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add subscription</DialogTitle>
          <DialogDescription>Assign a product plan to a customer manually.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit(form)
          }}
        >
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={form.user_id}
              onValueChange={(user_id) => setForm((f) => ({ ...f, user_id }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={form.product_id}
              onValueChange={handleProductChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={form.plan_id}
              onValueChange={handlePlanChange}
              disabled={!form.product_id || productPlans.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={productPlans.length ? 'Select plan' : 'No plans for product'} />
              </SelectTrigger>
              <SelectContent>
                {productPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(status) => setForm((f) => ({ ...f, status }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="create-sub-starts">Start date</Label>
              <Input
                id="create-sub-starts"
                type="date"
                value={form.starts_at}
                onChange={(e) => {
                  const starts_at = e.target.value
                  const plan = productPlans.find((p) => p.id === form.plan_id)
                  setForm((f) => ({
                    ...f,
                    starts_at,
                    ends_at: defaultEndDate(starts_at, plan?.billing_cycle ?? 'monthly'),
                  }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-sub-ends">End date</Label>
              <Input
                id="create-sub-ends"
                type="date"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
            <Label htmlFor="create-sub-auto-renew" className="cursor-pointer">Auto renew</Label>
            <Switch
              id="create-sub-auto-renew"
              checked={form.auto_renew}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, auto_renew: checked }))}
            />
          </div>
          {selectedProduct?.has_free_trial ? (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
              <Label htmlFor="create-sub-trial" className="cursor-pointer">Apply free trial</Label>
              <Switch
                id="create-sub-trial"
                checked={form.apply_trial}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, apply_trial: checked }))}
              />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.user_id || !form.product_id || !form.plan_id}
            >
              {saving ? 'Creating…' : 'Add subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
