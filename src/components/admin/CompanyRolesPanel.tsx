import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { CompanyRoleFormDialog, type CompanyRoleFormValues } from '@/components/admin/CompanyRoleFormDialog'
import { AdminPanelHeader } from '@/components/admin/AdminUi'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PortalPanel } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Switch } from '@/components/ui/switch'
import { adminApi } from '@/services/api'
import { asRecord, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminCompanyRole } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type CompanyRoleRow = ReturnType<typeof mapAdminCompanyRole>

type CompanyRolesPanelProps = {
  embedded?: boolean
}

export function CompanyRolesPanel({ embedded = false }: CompanyRolesPanelProps) {
  const [roles, setRoles] = useState<CompanyRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<CompanyRoleRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CompanyRoleRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRoles(unwrapList(await adminApi.companyRoles.list()).map(mapAdminCompanyRole))
    } catch (error) {
      toast({ title: 'Failed to load company roles', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, CompanyRoleRow[]>()
    for (const role of roles) {
      const key = role.category || 'Other'
      const list = map.get(key) ?? []
      list.push(role)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [roles])

  const openAdd = () => {
    setEditingRole(null)
    setDialogOpen(true)
  }

  const openEdit = (role: CompanyRoleRow) => {
    setEditingRole(role)
    setDialogOpen(true)
  }

  const saveRole = async (values: CompanyRoleFormValues) => {
    setSaving(true)
    try {
      if (editingRole?.id) {
        await adminApi.companyRoles.update(editingRole.id, values)
        toast({ title: 'Company role updated', variant: 'success' })
      } else {
        await adminApi.companyRoles.create({
          ...values,
          sort_order: values.sort_order || roles.length + 1,
        })
        toast({ title: 'Company role added', variant: 'success' })
      }
      setDialogOpen(false)
      setEditingRole(null)
      await load()
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.companyRoles.delete(deleteTarget.id)
      toast({ title: 'Company role deleted', variant: 'success' })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (role: CompanyRoleRow) => {
    try {
      await adminApi.companyRoles.update(role.id, { is_active: !role.is_active })
      await load()
    } catch (error) {
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const body = (
    <div className="p-4 sm:p-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center">
          <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-sm font-medium text-foreground">No company roles yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Seed defaults or add your first role.</p>
          <Button type="button" className="mt-4 gap-2 rounded-xl" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add role
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {category}
              </h4>
              <ul className="space-y-2">
                {items.map((role) => (
                  <li
                    key={role.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                      role.is_active ? 'border-[var(--border)] bg-[var(--card)]' : 'border-[var(--border)] bg-[var(--input)]/30 opacity-85',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{role.name}</p>
                        <Badge variant={role.is_active ? 'success' : 'secondary'}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {role.employees_count > 0 && (
                          <Badge variant="outline">{role.employees_count} employee{role.employees_count === 1 ? '' : 's'}</Badge>
                        )}
                        {!role.uses_default_portal_menus ? (
                          <Badge variant="secondary">Custom menus</Badge>
                        ) : null}
                      </div>
                      {role.employee_portal_menu_labels.length > 0 ? (
                        <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                          Employee portal: {role.employee_portal_menu_labels.join(', ')}
                          {!role.uses_default_portal_menus ? ' (custom)' : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={role.is_active}
                        onCheckedChange={() => void toggleActive(role)}
                        aria-label={`Toggle ${role.name}`}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(role)} aria-label={`Edit ${role.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setDeleteTarget(role)}
                        aria-label={`Delete ${role.name}`}
                        disabled={role.employees_count > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {embedded ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-sm text-[var(--muted-foreground)]">
              {roles.length} role{roles.length === 1 ? '' : 's'} in master list
            </p>
            <Button type="button" onClick={openAdd} className="gap-2 rounded-xl glow-btn">
              <Plus className="h-4 w-4" />
              Add role
            </Button>
          </div>
          {body}
        </div>
      ) : (
        <PortalPanel>
          <AdminPanelHeader
            icon={BadgeCheck}
            title="Company roles master"
            description="Standard job titles for SoftKatta — used when hiring and assigning employee designations."
            action={(
              <Button type="button" onClick={openAdd} className="gap-2 rounded-xl glow-btn">
                <Plus className="h-4 w-4" />
                Add role
              </Button>
            )}
          />
          {body}
        </PortalPanel>
      )}

      <CompanyRoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingRole ? {
          name: editingRole.name,
          slug: editingRole.slug,
          category: editingRole.category,
          sort_order: editingRole.sort_order,
          is_active: editingRole.is_active,
          employee_portal_menus: editingRole.employee_portal_menus,
          employee_portal_menus_override: editingRole.employee_portal_menus_override,
          uses_default_portal_menus: editingRole.uses_default_portal_menus,
        } : null}
        saving={saving}
        onSubmit={saveRole}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete company role?"
        description={`Remove "${deleteTarget?.name ?? 'this role'}" from the master list?`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}

export async function fetchActiveCompanyRoles() {
  const raw = unwrapList(await adminApi.companyRoles.list({ active_only: true }))
  return raw.map((item) => mapAdminCompanyRole(asRecord(item)))
}
