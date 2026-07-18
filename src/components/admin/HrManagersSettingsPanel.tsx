import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminPanelHeader } from '@/components/admin/AdminUi'
import { PortalPanel } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { adminApi } from '@/services/api'
import { asRecord, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

type HrManagerRow = {
  id: string
  name: string
  email: string
  is_active: boolean
}

function mapHrUser(raw: unknown): HrManagerRow {
  const item = asRecord(raw)
  return {
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    email: String(item.email ?? ''),
    is_active: item.is_active !== false,
  }
}

export function HrManagersSettingsPanel() {
  const [rows, setRows] = useState<HrManagerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = unwrapList(await adminApi.users.list({ role: 'hr_manager' })).map(mapHrUser)
      setRows(list)
    } catch (error) {
      toast({ title: 'Failed to load HR accounts', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      }
      await adminApi.hrManagers.create(payload)
      toast({
        title: 'HR manager created',
        description: `${payload.email} can sign in at /hr`,
        variant: 'success',
      })
      setForm({ name: '', email: '', password: '', phone: '' })
      await load()
    } catch (error) {
      toast({ title: 'Could not create HR account', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PortalPanel>
        <AdminPanelHeader
          icon={Users}
          title="HR portal accounts"
          description="Create HR manager logins for hiring, employees, leave, and attendance. They sign in at /hr — not the admin panel."
          action={(
            <Button asChild variant="outline" className="gap-2 rounded-xl">
              <Link to="/hr" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open /hr
              </Link>
            </Button>
          )}
        />
        <form onSubmit={handleCreate} className="space-y-4 border-b border-[var(--border)] p-6">
          <h4 className="text-sm font-semibold text-foreground">Add HR manager</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hr-name">Full name</Label>
              <Input
                id="hr-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Priya Sharma"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hr-email">Work email</Label>
              <Input
                id="hr-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hr@softkatta.com"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hr-password">Temporary password</Label>
              <Input
                id="hr-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="h-11 rounded-xl"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hr-phone">Phone (optional)</Label>
              <Input
                id="hr-phone"
                digitsOnly
                maxDigits={10}
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <Button type="submit" className="gap-2 rounded-xl glow-btn" disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? 'Creating…' : 'Create HR account'}
          </Button>
        </form>

        <div className="p-6">
          <h4 className="mb-4 text-sm font-semibold text-foreground">Existing HR managers ({rows.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              No HR portal accounts yet. Create one above or run{' '}
              <code className="text-xs">php artisan hr:create-manager</code>.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{row.email}</p>
                  </div>
                  <Badge variant={row.is_active ? 'success' : 'secondary'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PortalPanel>
    </div>
  )
}
