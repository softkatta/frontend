import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { PortalPanel } from '@/components/common/PortalPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { userAvatarUrl } from '@/lib/mediaUrl'
import { toast } from '@/components/ui/toaster'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'

export default function AccountProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')

  useEffect(() => {
    void (async () => {
      try {
        const profile = await authApi.me()
        setFirstName(profile.first_name ?? '')
        setLastName(profile.last_name ?? '')
        setEmail(profile.email ?? '')
        setCompany(profile.company ?? '')
        setPhone(profile.phone ?? '')
      } catch {
        // keep auth user defaults
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateProfile({
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim() || undefined,
        phone: phone || undefined,
        company_name: company || undefined,
      })
      await dispatch(fetchCurrentUser())
      toast({ title: 'Profile updated', variant: 'success' })
    } catch (error) {
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' })
      return
    }

    setUploadingAvatar(true)
    try {
      await authApi.uploadAvatar(file)
      await dispatch(fetchCurrentUser())
      toast({ title: 'Profile photo updated', variant: 'success' })
    } catch (error) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const displayName = `${firstName} ${lastName}`.trim() || 'User'
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? 'K'}`.toUpperCase()
  const avatarSrc = userAvatarUrl(user?.avatar, displayName)

  return (
    <PortalPageShell
      eyebrow="Account"
      heroTitle="Profile"
      heroDescription="Update your personal and contact information."
      title="Profile"
      description="Manage your account information and profile photo"
      loading={loading}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <PortalPanel className="p-6 text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <Avatar className="h-24 w-24 border-2 border-[var(--border)]">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="text-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--popover)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-[var(--input)]"
              aria-label="Change profile photo"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleAvatarChange(file)
                e.target.value = ''
              }}
            />
          </div>
          <h3 className="font-semibold text-foreground">{firstName} {lastName}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{email}</p>
          {company ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{company}</p> : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
          </Button>
        </PortalPanel>

        <PortalPanel className="lg:col-span-2 p-6">
          <h2 className="mb-6 font-display text-lg font-semibold">Personal Information</h2>
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </form>
        </PortalPanel>
      </div>
    </PortalPageShell>
  )
}
