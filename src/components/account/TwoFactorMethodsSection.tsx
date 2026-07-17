import { Children, useEffect, useState, type ReactNode } from 'react'
import { Shield, ShieldCheck } from 'lucide-react'
import { PortalPanel } from '@/components/common/PortalPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { authApi } from '@/services/api'
import type { PlatformSecurityPolicy, TwoFactorMethods } from '@/services/api/modules/auth.api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { createPasskeyRegistration } from '@/lib/webauthnClient'
import { toast } from '@/components/ui/toaster'

interface TwoFactorMethodsSectionProps {
  methods: TwoFactorMethods
  busy: boolean
  setBusy: (value: boolean) => void
  onMethodsChange: (methods: TwoFactorMethods) => void
  platformPolicy?: PlatformSecurityPolicy
  canDisableMethods?: {
    authenticator: boolean
    email: boolean
    passkey: boolean
  }
  enforceRequired?: boolean
  forceTwoFactor?: boolean
  enabledMethodCount?: number
}

const METHOD_LABELS = {
  authenticator: 'Authenticator app',
  email: 'Email OTP',
  passkey: 'Passkeys / WebAuthn',
} as const

function verificationTitle(method: keyof typeof METHOD_LABELS, enabled: boolean) {
  return `${METHOD_LABELS[method]} verification is ${enabled ? 'on' : 'off'}`
}

function connectedDescription(method: keyof typeof METHOD_LABELS, enabled: boolean, extra?: string) {
  if (extra) return extra
  return enabled
    ? `${METHOD_LABELS[method]} is connected to your account`
    : `${METHOD_LABELS[method]} is not connected to your account`
}

function VerificationDial({
  enabled,
  title,
  description,
  action,
  children,
}: {
  enabled: boolean
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: 'outline' | 'destructive' | 'default'
  }
  children?: ReactNode
}) {
  const Icon = enabled ? ShieldCheck : Shield
  const hasBody = Children.toArray(children).length > 0

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        enabled
          ? 'border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/[0.08]'
          : 'border-[var(--border)] bg-[var(--card)]'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <Icon
          className={`h-5 w-5 shrink-0 ${enabled ? 'text-[var(--brand-teal)]' : 'text-[var(--muted-foreground)]'}`}
          strokeWidth={enabled ? 2.25 : 1.75}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
          <p className="mt-0.5 text-sm leading-snug text-[var(--muted-foreground)]">{description}</p>
        </div>
        {action ? (
          <Button
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            className="h-9 shrink-0 rounded-lg border-[var(--border)] bg-[var(--card)] px-4 shadow-none"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ) : null}
      </div>
      {hasBody ? (
        <div className="space-y-3 border-t border-[var(--border)]/70 bg-[var(--card)]/50 px-4 py-4">
          {children}
        </div>
      ) : (
        <div className="border-t border-[var(--border)]/50" aria-hidden />
      )}
    </div>
  )
}

export function TwoFactorMethodsSection({
  methods,
  busy,
  setBusy,
  onMethodsChange,
  platformPolicy,
  canDisableMethods,
  enforceRequired = false,
  forceTwoFactor = false,
  enabledMethodCount = 0,
}: TwoFactorMethodsSectionProps) {
  const [authSetupOpen, setAuthSetupOpen] = useState(false)
  const [authDisableOpen, setAuthDisableOpen] = useState(false)
  const [emailEnableOpen, setEmailEnableOpen] = useState(false)
  const [emailDisableOpen, setEmailDisableOpen] = useState(false)
  const [passkeySetupOpen, setPasskeySetupOpen] = useState(false)
  const [passkeyDisableAllOpen, setPasskeyDisableAllOpen] = useState(false)
  const [passkeyDisableOpen, setPasskeyDisableOpen] = useState<string | null>(null)

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [passkeyName, setPasskeyName] = useState('My Passkey')
  const [passkeyDisablePassword, setPasskeyDisablePassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const policy = platformPolicy ?? {
    two_factor_login_enabled: false,
    allow_email_otp: true,
    allow_authenticator: true,
    allow_passkeys: true,
    enforce_2fa_all: false,
    enforce_2fa_roles: [],
    enforce_2fa_admins: false,
    enforce_2fa_clients: false,
    allow_users_disable_2fa: true,
    login_2fa_priority: ['passkey', 'authenticator', 'email'],
  }

  const disableAllowed = canDisableMethods ?? {
    authenticator: policy.allow_users_disable_2fa,
    email: policy.allow_users_disable_2fa,
    passkey: policy.allow_users_disable_2fa,
  }

  const showDisableBlocked = () => {
    toast({
      title: 'Cannot disable this method',
      description: forceTwoFactor
        ? 'Company policy requires 2FA. Enable another verification method first, or ask an admin to change the policy under Settings → Security.'
        : 'Disabling this verification method is not allowed for your account.',
      variant: 'destructive',
    })
  }

  const openDisableIfAllowed = (allowed: boolean, open: () => void) => {
    if (!allowed) {
      showDisableBlocked()
      return
    }
    open()
  }

  const anyMethodEnabled = methods.authenticator.enabled
    || methods.email.enabled
    || methods.passkey.enabled
  const [twoFactorVisible, setTwoFactorVisible] = useState(anyMethodEnabled)

  useEffect(() => {
    if (anyMethodEnabled) {
      setTwoFactorVisible(true)
    }
  }, [anyMethodEnabled])

  const resetForms = () => {
    setAuthSetupOpen(false)
    setAuthDisableOpen(false)
    setEmailEnableOpen(false)
    setEmailDisableOpen(false)
    setPasskeySetupOpen(false)
    setPasskeyDisableAllOpen(false)
    setPasskeyDisableOpen(null)
    setQrCodeUrl(null)
    setConfirmCode('')
    setDisablePassword('')
    setDisableCode('')
    setEmailCode('')
    setPasskeyDisablePassword('')
  }

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorVisible(enabled)
    if (!enabled) {
      resetForms()
    }
  }

  const startAuthenticatorSetup = async () => {
    setBusy(true)
    try {
      const setup = await authApi.setupTwoFactor()
      setQrCodeUrl(setup.qr_code_url)
      setAuthSetupOpen(true)
      toast({ title: 'Scan the QR code in your authenticator app', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not start setup', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const confirmAuthenticator = async () => {
    setBusy(true)
    try {
      const result = await authApi.confirmTwoFactor({ code: confirmCode })
      onMethodsChange(result.methods)
      setAuthSetupOpen(false)
      setQrCodeUrl(null)
      setConfirmCode('')
      if (result.recovery_codes?.length) {
        setRecoveryCodes(result.recovery_codes)
      }
      toast({ title: 'Authenticator app enabled', variant: 'success' })
    } catch (error) {
      toast({ title: 'Invalid code', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const disableAuthenticator = async () => {
    setBusy(true)
    try {
      const result = await authApi.disableTwoFactor({ password: disablePassword, code: disableCode })
      onMethodsChange(result.methods)
      setAuthDisableOpen(false)
      setDisablePassword('')
      setDisableCode('')
      toast({ title: 'Authenticator app disabled', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not disable', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const startEmailEnable = async () => {
    setBusy(true)
    try {
      await authApi.sendEmail2faEnableOtp()
      setEmailEnableOpen(true)
      toast({ title: 'Verification code sent to your email', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not send code', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const confirmEmailEnable = async () => {
    setBusy(true)
    try {
      const result = await authApi.confirmEmail2faEnable({ code: emailCode })
      onMethodsChange(result.methods)
      setEmailEnableOpen(false)
      setEmailCode('')
      toast({ title: 'Email OTP enabled', variant: 'success' })
    } catch (error) {
      toast({ title: 'Invalid code', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const startEmailDisable = async () => {
    setBusy(true)
    try {
      await authApi.sendEmail2faDisableOtp()
      setEmailDisableOpen(true)
      toast({ title: 'Verification code sent to your email', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not send code', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const disableEmail = async () => {
    setBusy(true)
    try {
      const result = await authApi.disableEmail2fa({ password: disablePassword, code: emailCode })
      onMethodsChange(result.methods)
      setEmailDisableOpen(false)
      setDisablePassword('')
      setEmailCode('')
      toast({ title: 'Email OTP disabled', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not disable', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const registerPasskey = async () => {
    setBusy(true)
    try {
      const options = await authApi.passkeyRegisterOptions()
      const attestation = await createPasskeyRegistration(options)
      const result = await authApi.passkeyRegisterVerify({
        ...attestation,
        device_name: passkeyName || 'Passkey',
      })
      onMethodsChange(result.methods)
      setPasskeySetupOpen(false)
      setPasskeyName('My Passkey')
      toast({ title: 'Passkey registered', variant: 'success' })
    } catch (error) {
      toast({ title: 'Passkey setup failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const disableAllPasskeys = async () => {
    setBusy(true)
    try {
      const result = await authApi.disableAllPasskeys({ password: passkeyDisablePassword })
      onMethodsChange(result.methods)
      resetPasskeyUi()
      toast({ title: 'Passkeys / WebAuthn disabled', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not disable passkeys', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const removePasskey = async (credentialId: string) => {
    setBusy(true)
    try {
      const result = await authApi.deletePasskey(credentialId, { password: passkeyDisablePassword })
      onMethodsChange(result.methods)
      setPasskeyDisableOpen(null)
      setPasskeyDisablePassword('')
      if (!result.methods.passkey.enabled) {
        setPasskeyDisableAllOpen(false)
      }
      toast({ title: 'Passkey removed', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not remove passkey', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const resetPasskeyUi = () => {
    setPasskeySetupOpen(false)
    setPasskeyDisableAllOpen(false)
    setPasskeyDisableOpen(null)
    setPasskeyDisablePassword('')
  }

  const passkeyCount = methods.passkey.credentials.length
  const passkeyEnabled = methods.passkey.enabled

  return (
    <PortalPanel className="shadow-sm">
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Two Factor Authentication</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {twoFactorVisible
                ? 'Choose how you want to verify your sign-in'
                : 'Enable to set up authenticator, email OTP, or passkeys'}
            </p>
            {enforceRequired ? (
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Your organization requires two-factor authentication.
              </p>
            ) : null}
            {forceTwoFactor && enabledMethodCount <= 1 ? (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                At least one verification method must stay enabled while company policy requires 2FA.
              </p>
            ) : null}
          </div>
          <Switch checked={twoFactorVisible} onCheckedChange={handleTwoFactorToggle} />
        </div>

        {twoFactorVisible ? (
          <div className="space-y-3 border-t border-[var(--border)] pt-5">
            {policy.allow_authenticator ? (
            <VerificationDial
              enabled={methods.authenticator.enabled}
              title={verificationTitle('authenticator', methods.authenticator.enabled)}
              description={connectedDescription('authenticator', methods.authenticator.enabled)}
              action={
                methods.authenticator.enabled
                  ? (authDisableOpen
                      ? { label: 'Cancel', onClick: () => setAuthDisableOpen(false) }
                      : {
                          label: 'Disable',
                          onClick: () => openDisableIfAllowed(disableAllowed.authenticator, () => setAuthDisableOpen(true)),
                        })
                  : authSetupOpen
                    ? { label: 'Cancel', onClick: () => setAuthSetupOpen(false) }
                    : { label: 'Enable', onClick: () => void startAuthenticatorSetup(), disabled: busy }
              }
            >
              {authSetupOpen && !methods.authenticator.enabled ? (
                <>
                  {qrCodeUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeUrl)}`}
                      alt="QR code"
                      className="mx-auto rounded-lg border bg-white p-2"
                    />
                  ) : null}
                  <Input
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="h-11 rounded-xl tracking-[0.3em]"
                  />
                  <Button className="rounded-lg" onClick={() => void confirmAuthenticator()} disabled={busy || confirmCode.length !== 6}>
                    Confirm & Enable
                  </Button>
                </>
              ) : null}
              {authDisableOpen && methods.authenticator.enabled ? (
                <>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Enter your account password and the 6-digit code from your authenticator app.
                  </p>
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Current password"
                    className="h-11 rounded-xl"
                  />
                  <Input
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Authenticator code"
                    className="h-11 rounded-xl tracking-[0.3em]"
                  />
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => void disableAuthenticator()}
                    disabled={busy || !disablePassword || disableCode.length !== 6}
                  >
                    Disable
                  </Button>
                </>
              ) : null}
            </VerificationDial>
            ) : null}

            {policy.allow_email_otp ? (
            <VerificationDial
              enabled={methods.email.enabled}
              title={verificationTitle('email', methods.email.enabled)}
              description={connectedDescription('email', methods.email.enabled)}
              action={
                methods.email.enabled
                  ? (emailDisableOpen
                      ? { label: 'Cancel', onClick: () => setEmailDisableOpen(false) }
                      : {
                          label: 'Disable',
                          onClick: () => openDisableIfAllowed(disableAllowed.email, () => void startEmailDisable()),
                        })
                  : emailEnableOpen
                    ? { label: 'Cancel', onClick: () => setEmailEnableOpen(false) }
                    : { label: 'Enable', onClick: () => void startEmailEnable(), disabled: busy }
              }
            >
              {emailEnableOpen && !methods.email.enabled ? (
                <>
                  <p className="text-sm text-[var(--muted-foreground)]">Enter the 6-digit code sent to your email.</p>
                  <Input
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="h-11 rounded-xl tracking-[0.3em]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-lg" onClick={() => void confirmEmailEnable()} disabled={busy || emailCode.length !== 6}>
                      Confirm & Enable
                    </Button>
                    <Button variant="outline" className="rounded-lg" onClick={() => void startEmailEnable()} disabled={busy}>
                      Resend Code
                    </Button>
                  </div>
                </>
              ) : null}
              {emailDisableOpen && methods.email.enabled ? (
                <>
                  <p className="text-sm text-[var(--muted-foreground)]">Enter your password and the code sent to your email.</p>
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Current password"
                    className="h-11 rounded-xl"
                  />
                  <Input
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Email code"
                    className="h-11 rounded-xl tracking-[0.3em]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => void disableEmail()}
                      disabled={busy || !disablePassword || emailCode.length !== 6}
                    >
                      Disable
                    </Button>
                    <Button variant="outline" className="rounded-lg" onClick={() => void startEmailDisable()} disabled={busy}>
                      Resend Code
                    </Button>
                  </div>
                </>
              ) : null}
            </VerificationDial>
            ) : null}

            {policy.allow_passkeys ? (
            <VerificationDial
              enabled={passkeyEnabled}
              title={verificationTitle('passkey', passkeyEnabled)}
              description={connectedDescription(
                'passkey',
                passkeyEnabled,
                passkeyEnabled
                  ? passkeyCount === 1
                    ? '1 passkey is connected to your account'
                    : `${passkeyCount} passkeys are connected to your account`
                  : undefined,
              )}
              action={
                passkeyEnabled
                  ? (passkeySetupOpen || passkeyDisableAllOpen || passkeyDisableOpen
                      ? { label: 'Cancel', onClick: resetPasskeyUi }
                      : {
                          label: 'Disable',
                          onClick: () => openDisableIfAllowed(disableAllowed.passkey, () => setPasskeyDisableAllOpen(true)),
                        })
                  : passkeySetupOpen
                    ? { label: 'Cancel', onClick: resetPasskeyUi }
                    : { label: 'Enable', onClick: () => setPasskeySetupOpen(true), disabled: busy }
              }
            >
              {passkeySetupOpen ? (
                <>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {passkeyEnabled
                      ? 'Register another device with biometrics or a security key.'
                      : 'Name your device, then register with biometrics or a security key.'}
                  </p>
                  <div className="space-y-2">
                    <Label>Device name</Label>
                    <Input
                      value={passkeyName}
                      onChange={(e) => setPasskeyName(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="MacBook Touch ID"
                    />
                  </div>
                  <Button className="rounded-lg" onClick={() => void registerPasskey()} disabled={busy}>
                    Register Passkey
                  </Button>
                </>
              ) : null}
              {passkeyDisableAllOpen && passkeyEnabled ? (
                <>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Enter your password to disable all passkeys on this account.
                  </p>
                  <Input
                    type="password"
                    value={passkeyDisablePassword}
                    onChange={(e) => setPasskeyDisablePassword(e.target.value)}
                    placeholder="Current password"
                    className="h-11 rounded-xl"
                  />
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => void disableAllPasskeys()}
                    disabled={busy || !passkeyDisablePassword}
                  >
                    Disable Passkeys
                  </Button>
                </>
              ) : null}
              {passkeyEnabled && !passkeySetupOpen && !passkeyDisableAllOpen && passkeyCount > 1 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Registered devices</p>
                  {methods.passkey.credentials.map((credential) => (
                    passkeyDisableOpen === credential.id ? (
                      <div key={credential.id} className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--input)]/30 p-3">
                        <p className="text-sm font-medium">{credential.name}</p>
                        <Input
                          type="password"
                          value={passkeyDisablePassword}
                          onChange={(e) => setPasskeyDisablePassword(e.target.value)}
                          placeholder="Current password"
                          className="h-11 rounded-xl"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => void removePasskey(credential.id)}
                            disabled={busy || !passkeyDisablePassword}
                          >
                            Remove
                          </Button>
                          <button
                            type="button"
                            className="text-sm text-[var(--muted-foreground)]"
                            onClick={() => setPasskeyDisableOpen(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={credential.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--input)]/30 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{credential.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {credential.last_used_at
                              ? `Last used ${new Date(credential.last_used_at).toLocaleString()}`
                              : 'Not used yet'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={() => setPasskeyDisableOpen(credential.id)}>
                          Remove
                        </Button>
                      </div>
                    )
                  ))}
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setPasskeySetupOpen(true)} disabled={busy}>
                    Add another passkey
                  </Button>
                </div>
              ) : null}
            </VerificationDial>
            ) : null}
          </div>
        ) : null}

        {recoveryCodes ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-foreground">Save your recovery codes</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Store these codes in a safe place. Each code can be used once if you lose access to your authenticator.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <code key={code} className="rounded-lg bg-[var(--card)] px-3 py-2 text-sm font-mono">
                  {code}
                </code>
              ))}
            </div>
            <Button className="mt-4 rounded-lg" size="sm" onClick={() => setRecoveryCodes(null)}>
              I have saved my codes
            </Button>
          </div>
        ) : null}
      </div>
    </PortalPanel>
  )
}
