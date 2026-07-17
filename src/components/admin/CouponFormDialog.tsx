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
import type { AdminCoupon, CouponType } from '@/types/offers'

export type CouponFormValues = {
  code: string
  name: string
  type: CouponType
  value: number
  min_order_amount: number
  max_uses: number
  max_uses_per_user: number
  product_id: string
  starts_at: string
  ends_at: string
  is_active: boolean
  description: string
}

const EMPTY: CouponFormValues = {
  code: '',
  name: '',
  type: 'percent',
  value: 10,
  min_order_amount: 0,
  max_uses: 0,
  max_uses_per_user: 1,
  product_id: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
  description: '',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AdminCoupon | null
  products: Array<{ id: string; name: string }>
  saving?: boolean
  onSubmit: (values: CouponFormValues) => void | Promise<void>
}

export function CouponFormDialog({ open, onOpenChange, initial, products, saving, onSubmit }: Props) {
  const [form, setForm] = useState<CouponFormValues>(EMPTY)
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        code: initial.code,
        name: initial.name,
        type: initial.type,
        value: initial.value,
        min_order_amount: initial.min_order_amount ?? 0,
        max_uses: initial.max_uses ?? 0,
        max_uses_per_user: initial.max_uses_per_user ?? 1,
        product_id: initial.product_id ?? '',
        starts_at: initial.starts_at?.slice(0, 16) ?? '',
        ends_at: initial.ends_at?.slice(0, 16) ?? '',
        is_active: initial.is_active,
        description: initial.description ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit coupon' : 'Create coupon'}</DialogTitle>
          <DialogDescription>Customers enter the code at checkout. Leave max uses empty for unlimited.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-name">Label</Label>
              <Input
                id="coupon-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CouponType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-value">Value</Label>
              <Input
                id="coupon-value"
                type="number"
                min={0.01}
                step={form.type === 'percent' ? 1 : 0.01}
                value={form.value || ''}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-min">Min order (₹)</Label>
              <Input
                id="coupon-min"
                type="number"
                min={0}
                value={form.min_order_amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, min_order_amount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Product (optional)</Label>
              <Select
                value={form.product_id || '__all__'}
                onValueChange={(v) => setForm((f) => ({ ...f, product_id: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="All products" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-max">Max total uses (0 = unlimited)</Label>
              <Input
                id="coupon-max"
                type="number"
                min={0}
                value={form.max_uses || ''}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-per-user">Max per user</Label>
              <Input
                id="coupon-per-user"
                type="number"
                min={1}
                value={form.max_uses_per_user || ''}
                onChange={(e) => setForm((f) => ({ ...f, max_uses_per_user: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-start">Starts at</Label>
              <Input
                id="coupon-start"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-end">Ends at</Label>
              <Input
                id="coupon-end"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coupon-desc">Description</Label>
            <textarea
              id="coupon-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-blue)]"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
            <Label htmlFor="coupon-active">Active</Label>
            <Switch
              id="coupon-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => void onSubmit(form)}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
