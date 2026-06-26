import { useState } from 'react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { PortalPanel } from '@/components/common/PortalPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

export default function ChangePasswordPage() {
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirmation) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      toast({ title: 'Password updated', variant: 'success' })
    } catch (error) {
      toast({ title: 'Password update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalPageShell
      eyebrow="Account"
      heroTitle="Change Password"
      heroDescription="Update your account password to keep your account secure."
      title="Change Password"
      description="Enter your current password and choose a new one"
      size="narrow"
    >
      <PortalPanel className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update Password'}</Button>
        </form>
      </PortalPanel>
    </PortalPageShell>
  )
}
