import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface AuthCredentialsFormProps {
  emailId?: string
  passwordId?: string
  email: string
  password: string
  passkeyOnly?: boolean
  submitting?: boolean
  submitLabel?: string
  passkeySubmitLabel?: string
  emailLabel?: string
  emailPlaceholder?: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onEmailBlur?: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function AuthCredentialsForm({
  emailId = 'email',
  passwordId = 'password',
  email,
  password,
  passkeyOnly = false,
  submitting = false,
  submitLabel = 'Sign in',
  passkeySubmitLabel = 'Continue with Passkey',
  emailLabel = 'Email address',
  emailPlaceholder = 'you@company.com',
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onSubmit,
}: AuthCredentialsFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>{emailLabel}</Label>
        <div className="portal-auth__input-wrap">
          <Mail className="portal-auth__input-icon h-4 w-4" />
          <Input
            id={emailId}
            type="email"
            required
            autoComplete="username"
            placeholder={emailPlaceholder}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={onEmailBlur}
            className="portal-auth__input h-12 rounded-xl pl-10"
          />
        </div>
      </div>

      {!passkeyOnly ? (
        <div className="space-y-2">
          <Label htmlFor={passwordId}>Password</Label>
          <div className="portal-auth__input-wrap">
            <KeyRound className="portal-auth__input-icon h-4 w-4" />
            <Input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="portal-auth__input h-12 rounded-xl pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--input)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          This account uses passkey sign-in. No password is required.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="portal-auth__submit glow-btn inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold disabled:opacity-50"
      >
        {submitting ? 'Signing in...' : (
          <>
            {passkeyOnly ? passkeySubmitLabel : submitLabel}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}
