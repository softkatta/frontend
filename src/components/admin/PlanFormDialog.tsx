import { useEffect, useState } from 'react'
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
import { asRecord, asString, unwrapList } from '@/lib/apiHelpers'

export type PlanFormValues = {
  product_id: string
  description: string
  is_active: boolean
  is_popular: boolean
  price_monthly: number
  price_yearly: number
  price_enterprise: number
}

const EMPTY: PlanFormValues = {
  product_id: '',
  description: '',
  is_active: true,
  is_popular: false,
  price_monthly: 0,
  price_yearly: 0,
  price_enterprise: 0,
}

type ProductOption = { id: string; name: string }

type PlanFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PlanFormValues | null
  lockProduct?: boolean
  saving?: boolean
  onSubmit: (values: PlanFormValues) => void | Promise<void>
}

export function PlanFormDialog({
  open,
  onOpenChange,
  initial,
  lockProduct,
  saving,
  onSubmit,
}: PlanFormDialogProps) {
  const [form, setForm] = useState<PlanFormValues>(EMPTY)
  const [products, setProducts] = useState<ProductOption[]>([])
  const isEdit = Boolean(lockProduct)

  useEffect(() => {
    if (!open) return
    void adminApi.products.list().then((res) => {
      setProducts(
        unwrapList(res).map((row) => {
          const product = asRecord(row)
          return { id: asString(product.id), name: asString(product.name, 'Product') }
        }),
      )
    })
  }, [open])

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      return
    }
    setForm(initial ?? EMPTY)
  }, [open, initial])

  const hasPrice = form.price_monthly > 0 || form.price_yearly > 0 || form.price_enterprise > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product plans' : 'Add product plans'}</DialogTitle>
          <DialogDescription>
            Set monthly, yearly, and enterprise prices for one product. Leave a field empty to skip that plan.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.product_id || !hasPrice) return
            void onSubmit(form)
          }}
        >
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select
              value={form.product_id || undefined}
              onValueChange={(product_id) => setForm((f) => ({ ...f, product_id }))}
              disabled={lockProduct}
            >
              <SelectTrigger className="bg-[var(--input-background)]">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Pricing (₹)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plan-monthly">Monthly</Label>
                <Input
                  id="plan-monthly"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price_monthly || ''}
                  onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) || 0 }))}
                  placeholder="4999"
                  className="bg-[var(--input-background)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-yearly">Yearly</Label>
                <Input
                  id="plan-yearly"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price_yearly || ''}
                  onChange={(e) => setForm((f) => ({ ...f, price_yearly: Number(e.target.value) || 0 }))}
                  placeholder="49990"
                  className="bg-[var(--input-background)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-enterprise">Enterprise</Label>
                <Input
                  id="plan-enterprise"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price_enterprise || ''}
                  onChange={(e) => setForm((f) => ({ ...f, price_enterprise: Number(e.target.value) || 0 }))}
                  placeholder="99999"
                  className="bg-[var(--input-background)]"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">At least one price is required. Clearing a price removes that plan.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-desc">Description</Label>
            <textarea
              id="plan-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Shared description for all billing cycles"
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="plan-active" checked={form.is_active} onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))} />
              <Label htmlFor="plan-active" className="cursor-pointer">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="plan-popular" checked={form.is_popular} onCheckedChange={(checked) => setForm((f) => ({ ...f, is_popular: checked }))} />
              <Label htmlFor="plan-popular" className="cursor-pointer">Popular badge (monthly)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.product_id || !hasPrice}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add plans'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
