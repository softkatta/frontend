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
  COMPANY_ROLE_CATEGORIES,
  EMPLOYEE_PORTAL_MENU_OPTIONS,
  defaultEmployeePortalMenus,
  type EmployeePortalMenuKey,
} from '@/lib/hrConstants'
import { adminApi } from '@/services/api'
import { asRecord, asString, unwrapList } from '@/lib/apiHelpers'
import { cn } from '@/lib/utils'

export type CompanyRoleFormValues = {
  name: string
  category: string
  sort_order: number
  is_active: boolean
  employee_portal_menus?: string[] | null
}

type MenuOption = { key: string; label: string }

type CompanyRoleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Partial<CompanyRoleFormValues> & {
    slug?: string
    uses_default_portal_menus?: boolean
    employee_portal_menus_override?: string[] | null
    employee_portal_menus?: string[]
  } | null
  saving?: boolean
  onSubmit: (values: CompanyRoleFormValues) => void | Promise<void>
}

const emptyForm: CompanyRoleFormValues = {
  name: '',
  category: '',
  sort_order: 0,
  is_active: true,
  employee_portal_menus: null,
}

export function CompanyRoleFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: CompanyRoleFormDialogProps) {
  const [form, setForm] = useState<CompanyRoleFormValues>(emptyForm)
  const [customizeMenus, setCustomizeMenus] = useState(false)
  const [menuKeys, setMenuKeys] = useState<string[]>(['dashboard'])
  const [catalog, setCatalog] = useState<MenuOption[]>(
    EMPLOYEE_PORTAL_MENU_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
  )

  const defaultMenus = useMemo(
    () => defaultEmployeePortalMenus(form.category, initial?.slug),
    [form.category, initial?.slug],
  )

  const defaultMenuLabels = useMemo(
    () => catalog
      .filter((option) => defaultMenus.includes(option.key as EmployeePortalMenuKey))
      .map((option) => option.label),
    [catalog, defaultMenus],
  )

  useEffect(() => {
    if (!open) return
    void (async () => {
      try {
        const rows = unwrapList(await adminApi.portalMenus.list({ portal: 'employee', active_only: true }))
          .map((raw) => {
            const item = asRecord(raw)
            return { key: asString(item.key), label: asString(item.label) || asString(item.key) }
          })
          .filter((row) => row.key)
        if (rows.length > 0) setCatalog(rows)
      } catch {
        /* keep static fallback */
      }
    })()
  }, [open])

  useEffect(() => {
    if (!open) return

    const hasOverride = Boolean(initial?.employee_portal_menus_override?.length)
      || initial?.uses_default_portal_menus === false

    setForm({
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active !== false,
      employee_portal_menus: initial?.employee_portal_menus_override ?? null,
    })
    setCustomizeMenus(hasOverride)
    setMenuKeys(
      (hasOverride
        ? initial?.employee_portal_menus_override
        : initial?.employee_portal_menus) as string[] | undefined
      ?? defaultEmployeePortalMenus(initial?.category ?? '', initial?.slug),
    )
  }, [open, initial])

  useEffect(() => {
    if (!open || customizeMenus) return
    setMenuKeys(defaultMenus)
  }, [open, customizeMenus, defaultMenus])

  const toggleMenuKey = (key: string, checked: boolean) => {
    if (key === 'dashboard') return

    setMenuKeys((prev) => {
      if (checked) {
        return prev.includes(key) ? prev : [...prev, key]
      }
      return prev.filter((item) => item !== key)
    })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void onSubmit({
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      employee_portal_menus: customizeMenus ? menuKeys : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initial?.name ? 'Edit company role' : 'Add company role'}</DialogTitle>
          <DialogDescription>
            Job titles used when hiring employees and assigning designations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-role-name">Role name</Label>
            <Input
              id="company-role-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Software Developer"
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-role-category">Category</Label>
            <select
              id="company-role-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
            >
              <option value="">Select category</option>
              {COMPANY_ROLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-role-sort">Sort order</Label>
            <Input
              id="company-role-sort"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Employee portal menus</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {customizeMenus
                    ? 'Choose which /employee sections staff with this role can access.'
                    : `Using category defaults: ${defaultMenuLabels.join(', ') || 'Core menus'}`}
                </p>
              </div>
              <Switch
                checked={customizeMenus}
                onCheckedChange={setCustomizeMenus}
                aria-label="Customize employee portal menus"
              />
            </div>

            {customizeMenus ? (
              <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
                {catalog.map((option) => {
                  const checked = menuKeys.includes(option.key)
                  const disabled = option.key === 'dashboard'

                  return (
                    <label
                      key={option.key}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                        checked ? 'border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/5' : 'border-[var(--border)]',
                        disabled && 'opacity-80',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)]"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => toggleMenuKey(option.key, e.target.checked)}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-[var(--muted-foreground)]">Inactive roles are hidden from dropdowns.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              aria-label="Toggle role active"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : initial?.name ? 'Save changes' : 'Add role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
