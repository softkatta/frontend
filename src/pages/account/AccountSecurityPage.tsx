import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, KeyRound, MonitorSmartphone, Shield } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { SecuritySectionCard } from '@/components/account/SecuritySectionCard'
import { TwoFactorMethodsSection } from '@/components/account/TwoFactorMethodsSection'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { authApi } from '@/services/api'
import type { PlatformSecurityPolicy, SecuritySession, TrustedDevice, TwoFactorMethods } from '@/services/api/modules/auth.api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'

const emptyMethods: TwoFactorMethods = {
  authenticator: { enabled: false },
  email: { enabled: false },
  passkey: { enabled: false, credentials: [] },
}

const METHOD_LABELS = {
  email: 'Email OTP',
  authenticator: 'Authenticator App',
  passkey: 'Passkey',
} as const

const emptyCanDisableMethods = {
  authenticator: false,
  email: false,
  passkey: false,
}

interface AccountSecurityPageProps {
  changePasswordPath: string
}

export default function AccountSecurityPage({
  changePasswordPath,
}: AccountSecurityPageProps) {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<TwoFactorMethods>(emptyMethods)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [sessions, setSessions] = useState<SecuritySession[]>([])
  const [platformPolicy, setPlatformPolicy] = useState<PlatformSecurityPolicy | undefined>()
  const [enabledMethods, setEnabledMethods] = useState<string[]>([])
  const [enforceRequired, setEnforceRequired] = useState(false)
  const [forceTwoFactor, setForceTwoFactor] = useState(false)
  const [canDisableMethods, setCanDisableMethods] = useState(emptyCanDisableMethods)
  const [lastLoginAt, setLastLoginAt] = useState<string | undefined>()
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [status, sessionList] = await Promise.all([
        authApi.securityStatus(),
        authApi.listSessions(),
      ])
      setMethods(status.methods ?? emptyMethods)
      setLoginAlerts(status.login_alerts_enabled)
      setSessionTimeout(status.session_timeout_minutes)
      setPlatformPolicy(status.platform_policy)
      setEnabledMethods(status.enabled_methods ?? [])
      setEnforceRequired(status.enforce_2fa_required)
      setForceTwoFactor(status.force_two_factor ?? false)
      setCanDisableMethods(status.can_disable_methods ?? emptyCanDisableMethods)
      setLastLoginAt(status.last_login_at)
      setTrustedDevices(status.trusted_devices ?? [])
      setSessions(sessionList)
    } catch (error) {
      toast({ title: 'Failed to load security settings', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleMethodsChange = async (nextMethods: TwoFactorMethods) => {
    setMethods(nextMethods)
    await dispatch(fetchCurrentUser())
    await load()
  }

  const saveLoginAlerts = async (enabled: boolean) => {
    setLoginAlerts(enabled)
    try {
      await authApi.updateSecurityPreferences({ login_alerts_enabled: enabled })
      await dispatch(fetchCurrentUser())
      toast({ title: 'Security preferences updated', variant: 'success' })
    } catch (error) {
      setLoginAlerts(!enabled)
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const revokeSessions = async () => {
    setBusy(true)
    try {
      await authApi.revokeOtherSessions()
      await load()
      toast({ title: 'Other sessions signed out', variant: 'success' })
    } catch (error) {
      toast({ title: 'Failed to revoke sessions', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const enabledCount = enabledMethods.length

  return (
    <PortalPageShell
      eyebrow="Account"
      heroTitle="Security"
      heroDescription="Manage two-factor authentication, login alerts, and active sessions."
      title="Account Security"
      description="Protect your sign-in with verification methods and session controls."
      size="narrow"
      layout="sections"
      loading={loading}
    >
      <TwoFactorMethodsSection
        methods={methods}
        busy={busy}
        setBusy={setBusy}
        onMethodsChange={(next) => void handleMethodsChange(next)}
        platformPolicy={platformPolicy}
        canDisableMethods={canDisableMethods}
        enforceRequired={enforceRequired}
        forceTwoFactor={forceTwoFactor}
        enabledMethodCount={enabledCount}
      />

      <SecuritySectionCard
        title="Security Overview"
        description="Active verification methods and recent account activity."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-foreground">Enabled methods</p>
                {enabledMethods.length === 0 ? (
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">No verification methods enabled yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {enabledMethods.map((method) => (
                      <li key={method} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-[var(--brand-teal)]" />
                        {METHOD_LABELS[method as keyof typeof METHOD_LABELS] ?? method}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-sm font-semibold text-foreground">Last login</p>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : 'No recent sign-in recorded'}
            </p>
          </div>
        </div>
      </SecuritySectionCard>

      <SecuritySectionCard
        title="Trusted Devices"
        description="Devices that have recently signed in to your account."
      >
        <div className="space-y-3">
          {trustedDevices.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No trusted devices recorded yet.</p>
          ) : (
            trustedDevices.map((device) => (
              <div key={device.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <MonitorSmartphone className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{device.device_name}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                    {device.last_login_at
                      ? `Last login: ${new Date(device.last_login_at).toLocaleString()}`
                      : 'Recently added'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </SecuritySectionCard>

      <SecuritySectionCard
        title="Password"
        description="Use a strong password and update it regularly."
        action={(
          <Button asChild variant="outline" size="sm" className="h-9 shrink-0 rounded-lg border-[var(--border)] bg-[var(--card)] px-4 shadow-none">
            <Link to={changePasswordPath}>Change Password</Link>
          </Button>
        )}
      >
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <KeyRound className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Account password</p>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              Update your password from the dedicated change password page.
            </p>
          </div>
        </div>
      </SecuritySectionCard>

      <SecuritySectionCard
        title="Login Alerts"
        description="Get notified when someone signs in to your account."
        action={<Switch checked={loginAlerts} onCheckedChange={(v) => void saveLoginAlerts(v)} />}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <Bell className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Email notifications are {loginAlerts ? 'on' : 'off'}
              </p>
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                {loginAlerts
                  ? 'You will receive alerts for new sign-ins.'
                  : 'Turn on alerts to get notified about new sign-ins.'}
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Session timeout policy: {sessionTimeout > 0 ? `${sessionTimeout} minutes` : 'No limit'}
          </p>
        </div>
      </SecuritySectionCard>

      <SecuritySectionCard
        title="Active Sessions"
        description="Review devices currently signed in to your account."
      >
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No active sessions found.</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-3 rounded-xl border p-4 ${
                  session.is_current
                    ? 'border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/[0.08]'
                    : 'border-[var(--border)] bg-[var(--card)]'
                }`}
              >
                <MonitorSmartphone
                  className={`h-5 w-5 shrink-0 ${session.is_current ? 'text-[var(--brand-teal)]' : 'text-[var(--muted-foreground)]'}`}
                  strokeWidth={session.is_current ? 2.25 : 1.75}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{session.name}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                    {session.last_used_at
                      ? `Last active: ${new Date(session.last_used_at).toLocaleString()}`
                      : 'Not used yet'}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${
                  session.is_current ? 'text-[var(--brand-teal)]' : 'text-[var(--muted-foreground)]'
                }`}>
                  {session.is_current ? 'Current' : 'Other'}
                </span>
              </div>
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-[var(--border)] bg-[var(--card)] shadow-none"
            disabled={busy || sessions.length <= 1}
            onClick={() => void revokeSessions()}
          >
            Sign Out All Other Devices
          </Button>
        </div>
      </SecuritySectionCard>
    </PortalPageShell>
  )
}
