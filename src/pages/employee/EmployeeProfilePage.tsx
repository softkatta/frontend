import { useCallback, useEffect, useState } from 'react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

export default function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', employee_code: '', department: '', designation: '', reporting_manager: '', pf_uan: '', esic_number: '', date_of_joining: '' })
  const [phone, setPhone] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.profile.get())
      setProfile({
        full_name: asString(raw.full_name),
        email: asString(raw.email),
        phone: asString(raw.phone),
        employee_code: asString(raw.employee_code),
        department: asString(raw.department),
        designation: asString(raw.designation),
        reporting_manager: asString(raw.reporting_manager),
        pf_uan: asString(raw.pf_uan),
        esic_number: asString(raw.esic_number),
        date_of_joining: asString(raw.date_of_joining),
      })
      setPhone(asString(raw.phone))
    } catch (err) {
      toast({ title: 'Failed to load profile', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await employeeApi.profile.update({ phone })
      toast({ title: 'Profile updated', variant: 'success' })
      await load()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome eyebrow="Profile" title="My profile" description="View your employment details. Update contact phone below." />
      <PortalPanel>
        <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Employee ID</span><p className="font-medium">{profile.employee_code || '—'}</p></div>
          <div><span className="text-muted-foreground">Name</span><p className="font-medium">{profile.full_name}</p></div>
          <div><span className="text-muted-foreground">Email</span><p className="font-medium">{profile.email}</p></div>
          <div><span className="text-muted-foreground">Department</span><p className="font-medium">{profile.department || '—'}</p></div>
          <div><span className="text-muted-foreground">Designation</span><p className="font-medium">{profile.designation || '—'}</p></div>
          <div><span className="text-muted-foreground">Reporting manager</span><p className="font-medium">{profile.reporting_manager || '—'}</p></div>
          <div><span className="text-muted-foreground">Date of joining</span><p className="font-medium">{profile.date_of_joining ? formatDate(profile.date_of_joining) : '—'}</p></div>
          <div><span className="text-muted-foreground">PF / UAN</span><p className="font-medium">{profile.pf_uan || '—'}</p></div>
          <div><span className="text-muted-foreground">ESIC</span><p className="font-medium">{profile.esic_number || '—'}</p></div>
        </div>
        <form onSubmit={handleSave} className="p-4 sm:p-6 border-t border-[var(--border)] grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mobile number (editable)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="rounded-xl">{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </PortalPanel>
    </PortalPage>
  )
}
