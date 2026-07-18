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

export type EmployeeFormValues = {
  full_name: string
  email: string
  phone: string
  department: string
  company_role_id: string
  designation: string
  portal_email: string
  is_active: boolean
}

type CompanyRoleOption = { id: string; name: string; category: string }

type EmployeeFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  onOpenChange: (open: boolean) => void
  initial?: Partial<Omit<EmployeeFormValues, 'portal_email'>> | null
  companyRoles: CompanyRoleOption[]
  saving?: boolean
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>
}

const EMPTY: EmployeeFormValues = {
  full_name: '',
  email: '',
  phone: '',
  department: '',
  company_role_id: '',
  designation: '',
  portal_email: '',
  is_active: true,
}

export function EmployeeFormDialog({
  open,
  mode,
  onOpenChange,
  initial,
  companyRoles,
  saving,
  onSubmit,
}: EmployeeFormDialogProps) {
  const [form, setForm] = useState<EmployeeFormValues>(EMPTY)

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        full_name: initial?.full_name ?? '',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
        department: initial?.department ?? '',
        company_role_id: initial?.company_role_id ?? '',
        designation: initial?.designation ?? '',
        is_active: initial?.is_active ?? true,
        portal_email: '',
      })
    }
  }, [open, initial])

  const handleRoleChange = (roleId: string) => {
    const role = companyRoles.find((item) => item.id === roleId)
    setForm((current) => ({
      ...current,
      company_role_id: roleId,
      designation: role && !current.designation ? role.name : current.designation,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add employee' : 'Edit employee'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create an employee profile and portal login at /employee.'
              : 'Update employee profile and account status.'}
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
            <Label htmlFor="employee-name">Full name</Label>
            <Input
              id="employee-name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Phone</Label>
              <Input
                id="employee-phone"
                digitsOnly
                maxDigits={10}
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
              />
            </div>
          </div>
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="employee-portal-email">Portal login email (optional)</Label>
              <Input
                id="employee-portal-email"
                type="email"
                value={form.portal_email}
                onChange={(e) => setForm((f) => ({ ...f, portal_email: e.target.value }))}
                placeholder="Leave blank to use email above"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-department">Department</Label>
              <Input
                id="employee-department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-role">Company role</Label>
              <select
                id="employee-role"
                value={form.company_role_id}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
              >
                <option value="">Select role</option>
                {companyRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-designation">Designation</Label>
            <Input
              id="employee-designation"
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              placeholder="Developer"
            />
          </div>
          {mode === 'edit' && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
              <Label htmlFor="employee-active" className="cursor-pointer">Active account</Label>
              <Switch
                id="employee-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create employee' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
