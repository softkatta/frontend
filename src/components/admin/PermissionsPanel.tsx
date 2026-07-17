import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, RefreshCw, Save } from 'lucide-react'
import { AdminPanelHeader } from '@/components/admin/AdminUi'
import { PortalPanel } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { adminApi } from '@/services/api'
import { asRecord, getApiErrorMessage, unwrapPayload } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type PermissionItem = { name: string; label: string }
type CatalogGroup = { group: string; permissions: PermissionItem[] }
type AccessRole = { name: string; label: string; permissions: string[]; users_count: number }

type PermissionsPanelProps = {
  embedded?: boolean
}

export function PermissionsPanel({ embedded = false }: PermissionsPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [roles, setRoles] = useState<AccessRole[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [draftPermissions, setDraftPermissions] = useState<string[]>([])

  const load = useCallback(async (options?: { syncIfEmpty?: boolean }) => {
    setLoading(true)
    try {
      let data = unwrapPayload(await adminApi.accessRoles.list())

      const parseCatalog = (payload: Record<string, unknown>) => (
        Array.isArray(payload.catalog)
          ? payload.catalog.map((group) => {
              const row = asRecord(group)
              const permissions = Array.isArray(row.permissions)
                ? row.permissions.map((item) => {
                    const perm = asRecord(item)
                    return {
                      name: String(perm.name ?? ''),
                      label: String(perm.label ?? perm.name ?? ''),
                    }
                  })
                : []
              return { group: String(row.group ?? 'Other'), permissions }
            })
          : []
      )

      const parseRoles = (payload: Record<string, unknown>) => (
        Array.isArray(payload.roles)
          ? payload.roles.map((item) => {
              const row = asRecord(item)
              return {
                name: String(row.name ?? ''),
                label: String(row.label ?? row.name ?? ''),
                permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [],
                users_count: Number(row.users_count ?? 0),
              }
            })
          : []
      )

      let nextCatalog = parseCatalog(data)
      let nextRoles = parseRoles(data)

      if ((nextCatalog.length === 0 || nextRoles.length === 0) && options?.syncIfEmpty !== false) {
        data = unwrapPayload(await adminApi.accessRoles.sync())
        nextCatalog = parseCatalog(data)
        nextRoles = parseRoles(data)
      }

      setCatalog(nextCatalog)
      setRoles(nextRoles)

      if (nextCatalog.length === 0 && nextRoles.length === 0) {
        toast({
          title: 'No permissions loaded',
          description: 'Try Sync defaults or run php artisan permissions:sync on the server.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({ title: 'Failed to load permissions', description: getApiErrorMessage(error), variant: 'destructive' })
      setCatalog([])
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selectedRole && roles.length > 0) {
      setSelectedRole(roles[0].name)
      return
    }
    const roleRow = roles.find((role) => role.name === selectedRole)
    if (roleRow) {
      setDraftPermissions(roleRow.permissions)
    }
  }, [roles, selectedRole])

  const activeRole = useMemo(
    () => roles.find((role) => role.name === selectedRole) ?? null,
    [roles, selectedRole],
  )

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName)
    const roleRow = roles.find((role) => role.name === roleName)
    setDraftPermissions(roleRow?.permissions ?? [])
  }

  const togglePermission = (permission: string) => {
    setDraftPermissions((current) => (
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    ))
  }

  const toggleGroup = (group: CatalogGroup, checked: boolean) => {
    const names = group.permissions.map((item) => item.name)
    setDraftPermissions((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...names]))
      }
      return current.filter((item) => !names.includes(item))
    })
  }

  const handleSave = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      await adminApi.accessRoles.update(selectedRole, { permissions: draftPermissions })
      toast({ title: 'Permissions saved', variant: 'success' })
      await load({ syncIfEmpty: false })
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await adminApi.accessRoles.sync()
      toast({ title: 'Default permissions synced', variant: 'success' })
      await load({ syncIfEmpty: false })
    } catch (error) {
      toast({ title: 'Sync failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const totalPermissions = useMemo(
    () => catalog.reduce((sum, group) => sum + group.permissions.length, 0),
    [catalog],
  )

  const panelContent = (
    <div className={embedded ? 'p-4 sm:p-6' : 'p-4 sm:p-6'}>
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : catalog.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No permissions found</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sync the default permission catalog to get started.</p>
          <Button type="button" className="mt-4 gap-2 rounded-xl" onClick={() => void handleSync()} disabled={syncing}>
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            Sync defaults
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Access roles</p>
            {roles.map((role) => (
              <button
                key={role.name}
                type="button"
                onClick={() => handleRoleSelect(role.name)}
                className={cn(
                  'flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors',
                  selectedRole === role.name
                    ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/5'
                    : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--input)]/40',
                )}
              >
                <span className="font-medium text-foreground">{role.label}</span>
                <span className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {role.permissions.length} permissions · {role.users_count} user{role.users_count === 1 ? '' : 's'}
                </span>
              </button>
            ))}
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-display text-lg font-semibold">{activeRole?.label ?? 'Select a role'}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {draftPermissions.length} of {totalPermissions} permissions selected
                </p>
              </div>
              <Button type="button" className="gap-2 rounded-xl glow-btn" onClick={() => void handleSave()} disabled={saving || !selectedRole}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save permissions'}
              </Button>
            </div>

            <div className="space-y-4">
              {catalog.map((group) => {
                const groupNames = group.permissions.map((item) => item.name)
                const selectedCount = groupNames.filter((name) => draftPermissions.includes(name)).length
                const allSelected = selectedCount === groupNames.length && groupNames.length > 0

                return (
                  <section key={group.group} className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-foreground">{group.group}</h5>
                        <Badge variant="secondary">{selectedCount}/{groupNames.length}</Badge>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleGroup(group, e.target.checked)}
                        />
                        Select all
                      </label>
                    </div>
                    <ul className="divide-y divide-[var(--border)]">
                      {group.permissions.map((permission) => (
                        <li key={permission.name} className="flex items-start gap-3 px-4 py-3">
                          <input
                            id={`perm-${permission.name}`}
                            type="checkbox"
                            className="mt-1"
                            checked={draftPermissions.includes(permission.name)}
                            onChange={() => togglePermission(permission.name)}
                          />
                          <label htmlFor={`perm-${permission.name}`} className="min-w-0 cursor-pointer">
                            <p className="text-sm font-medium text-foreground">{permission.label}</p>
                            <p className="text-xs text-[var(--muted-foreground)] font-mono">{permission.name}</p>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            {totalPermissions} permissions across {roles.length} login roles
          </p>
          <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => void handleSync()} disabled={syncing}>
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            Sync defaults
          </Button>
        </div>
        {panelContent}
      </div>
    )
  }

  return (
    <PortalPanel>
      <AdminPanelHeader
        icon={KeyRound}
        title="Roles & permissions"
        description={`Access control for employee portal, HR, and client users. ${totalPermissions} permissions across ${roles.length} roles.`}
        action={(
          <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => void handleSync()} disabled={syncing}>
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            Sync defaults
          </Button>
        )}
      />

      {panelContent}
    </PortalPanel>
  )
}
