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

export type SubscriptionFormValues = {
  status: string
  auto_renew: boolean
  starts_at: string
  ends_at: string
}

type SubscriptionFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: string
  product?: string
  initial?: SubscriptionFormValues | null
  saving?: boolean
  onSubmit: (values: SubscriptionFormValues) => void | Promise<void>
}

const EMPTY: SubscriptionFormValues = {
  status: 'active',
  auto_renew: true,
  starts_at: '',
  ends_at: '',
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expiring_soon', label: 'Expiring soon' },
  { value: 'suspend', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
]

function toDateInput(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  customer,
  product,
  initial,
  saving,
  onSubmit,
}: SubscriptionFormDialogProps) {
  const [form, setForm] = useState<SubscriptionFormValues>(EMPTY)

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            ...initial,
            starts_at: toDateInput(initial.starts_at),
            ends_at: toDateInput(initial.ends_at),
          }
        : EMPTY,
    )
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage subscription</DialogTitle>
          <DialogDescription>
            {customer && product ? `${customer} · ${product}` : 'Update subscription status and billing dates.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit(form)
          }}
        >
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(status) => setForm((f) => ({ ...f, status }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sub-starts">Start date</Label>
              <Input
                id="sub-starts"
                type="date"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-ends">End date</Label>
              <Input
                id="sub-ends"
                type="date"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
            <Label htmlFor="sub-auto-renew" className="cursor-pointer">Auto renew</Label>
            <Switch
              id="sub-auto-renew"
              checked={form.auto_renew}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, auto_renew: checked }))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
