import { useEffect, useState } from 'react'
import { Fingerprint, KeyRound, LifeBuoy, Mail } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authApi } from '@/services/api'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

interface TwoFactorLoginStepProps {
  challengeToken: string
  methods: TwoFactorMethodName[]
  code: string
  onCodeChange: (value: string) => void
  onSubmit: (method: 'authenticator' | 'email' | 'recovery', code: string) => void
  onPasskeyLogin: () => void
  onBack: () => void
  submitting?: boolean
}

const methodMeta: Record<TwoFactorMethodName, { label: string; icon: typeof KeyRound }> = {
  authenticator: { label: 'Authenticator', icon: KeyRound },
  email: { label: 'Email OTP', icon: Mail },
  passkey: { label: 'Passkey', icon: Fingerprint },
}

export function TwoFactorLoginStep({
  challengeToken,
  methods,
  code,
  onCodeChange,
  onSubmit,
  onPasskeyLogin,
  onBack,
  submitting = false,
}: TwoFactorLoginStepProps) {
  const available: TwoFactorMethodName[] = methods.length > 0 ? methods : ['authenticator']
  const [activeMethod, setActiveMethod] = useState<TwoFactorMethodName>(available[0])
  const [emailSent, setEmailSent] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')

  useEffect(() => {
    if (!available.includes(activeMethod)) {
      setActiveMethod(available[0])
    }
  }, [activeMethod, available])

  const sendEmailCode = async () => {
    try {
      await authApi.sendLoginEmailOtp({ challenge_token: challengeToken })
      setEmailSent(true)
      toast({ title: 'Verification code sent to your email', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not send code', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {recoveryMode ? (
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium text-foreground">Use a recovery code</p>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Enter one of the recovery codes you saved when you enabled your authenticator app.
          </p>
          <Input
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="h-11 rounded-xl font-mono tracking-wider"
          />
          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={submitting || recoveryCode.replace(/[^A-Z0-9]/g, '').length < 8}
            onClick={() => onSubmit('recovery', recoveryCode)}
          >
            {submitting ? 'Verifying…' : 'Verify Recovery Code'}
          </Button>
          <button
            type="button"
            className="text-sm text-[var(--brand-teal)]"
            onClick={() => setRecoveryMode(false)}
          >
            Back to verification methods
          </button>
        </div>
      ) : (
        <>
      <p className="text-sm text-[var(--muted-foreground)]">
        Choose how you want to verify your sign-in.
      </p>

      <div className="flex flex-wrap gap-2">
        {available.map((method) => {
          const Icon = methodMeta[method].icon
          return (
            <Button
              key={method}
              type="button"
              size="sm"
              variant={activeMethod === method ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setActiveMethod(method)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {methodMeta[method].label}
            </Button>
          )
        })}
      </div>

      {activeMethod === 'passkey' ? (
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Use your device fingerprint, Face ID, or security key to continue.
          </p>
          <Button type="button" className="w-full rounded-xl" disabled={submitting} onClick={onPasskeyLogin}>
            Continue with Passkey
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {activeMethod === 'email'
              ? 'Enter the 6-digit code sent to your email address.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
          {activeMethod === 'email' ? (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void sendEmailCode()} disabled={submitting}>
              {emailSent ? 'Resend Code' : 'Send Code'}
            </Button>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="two-factor-code">Verification code</Label>
            <Input
              id="two-factor-code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-11 rounded-xl tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
            />
          </div>
          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={submitting || code.length !== 6}
            onClick={() => onSubmit(activeMethod === 'email' ? 'email' : 'authenticator', code)}
          >
            {submitting ? 'Verifying…' : 'Verify & Sign In'}
          </Button>
          {available.includes('authenticator') ? (
            <button
              type="button"
              className="text-sm text-[var(--brand-teal)]"
              onClick={() => setRecoveryMode(true)}
            >
              Can&apos;t access your authenticator?
            </button>
          ) : null}
        </div>
      )}

      <Button type="button" variant="outline" className="rounded-xl" onClick={onBack} disabled={submitting}>
        Back
      </Button>
        </>
      )}
    </div>
  )
}
