import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

type UsagePlan = {
  id: string
  product_id: string
  product_name: string
  name: string
  price: number
  billing_cycle: string
  description: string
  is_active: boolean
  is_popular: boolean
  sort_order: number
  limits: Record<string, unknown>
  max_customers: number
  max_gst_invoices: number
  max_non_gst_invoices: number
  invoice_limit_period: string
}

type Props = {
  plan: UsagePlan | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void | Promise<void>
}

export function PlanUsageLimitsDialog({ plan, onOpenChange, onSaved }: Props) {
  const [customers, setCustomers] = useState(0)
  const [gstInvoices, setGstInvoices] = useState(0)
  const [nonGstInvoices, setNonGstInvoices] = useState(0)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!plan) return
    setCustomers(plan.max_customers)
    setGstInvoices(plan.max_gst_invoices)
    setNonGstInvoices(plan.max_non_gst_invoices)
    setPeriod(plan.invoice_limit_period === 'yearly' ? 'yearly' : 'monthly')
  }, [plan])

  const save = async () => {
    if (!plan) return
    setSaving(true)
    try {
      await adminApi.plans.update(plan.id, {
        product_id: Number(plan.product_id),
        name: plan.name,
        description: plan.description || undefined,
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        is_active: plan.is_active,
        is_popular: plan.is_popular,
        sort_order: plan.sort_order,
        limits: {
          ...plan.limits,
          max_customers: customers,
          max_gst_invoices: gstInvoices,
          max_non_gst_invoices: nonGstInvoices,
          invoice_limit_period: period,
        },
      })
      toast({ title: 'Usage limits updated', description: `${plan.product_name} · ${plan.name}`, variant: 'success' })
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast({ title: 'Could not update limits', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage usage limits</DialogTitle>
          <DialogDescription>
            {plan ? `${plan.product_name} · ${plan.name} · ${plan.billing_cycle}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="usage-max-customers">Customer limit</Label>
            <Input id="usage-max-customers" type="number" min={0} value={customers} onChange={(e) => setCustomers(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usage-gst-invoices">GST invoice limit</Label>
            <Input id="usage-gst-invoices" type="number" min={0} value={gstInvoices} onChange={(e) => setGstInvoices(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usage-non-gst-invoices">Without-GST invoice limit</Label>
            <Input id="usage-non-gst-invoices" type="number" min={0} value={nonGstInvoices} onChange={(e) => setNonGstInvoices(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Invoice quota period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Per month</SelectItem>
                <SelectItem value="yearly">Per year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Set 0 to block that invoice type. Active installations receive changes on their next licence verification.</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save limits'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}