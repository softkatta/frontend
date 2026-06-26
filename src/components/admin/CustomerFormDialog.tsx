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

export type CustomerFormValues = {
  name: string
  email: string
  password: string
  phone: string
  company_name: string
  is_active: boolean
}

type CustomerFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  onOpenChange: (open: boolean) => void
  initial?: Omit<CustomerFormValues, 'password'> | null
  saving?: boolean
  onSubmit: (values: CustomerFormValues) => void | Promise<void>
}

const EMPTY: CustomerFormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  company_name: '',
  is_active: true,
}

export function CustomerFormDialog({
  open,
  mode,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: CustomerFormDialogProps) {
  const [form, setForm] = useState<CustomerFormValues>(EMPTY)

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        ...(initial ?? {}),
        password: '',
      })
    }
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add customer' : 'Edit customer'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new customer account with workspace access.'
              : 'Update customer profile and account status.'}
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
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="customer-password">Password</Label>
              <Input
                id="customer-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-company">Company</Label>
            <Input
              id="customer-company"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
            <Label htmlFor="customer-active" className="cursor-pointer">Active account</Label>
            <Switch
              id="customer-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create customer' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
