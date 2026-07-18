import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Shield } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { setAdminWorkspaceMode } from '@/services/api/client'
import { authApi } from '@/services/api'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'
import { loginUser, logoutUser, verify2faLogin, verifyPasskeyLogin, verifyPasskeyPrimaryLogin } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function AdminLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const { enabled: maintenanceEnabled } = useMaintenanceMode()
  const { getToken } = useRecaptcha('login')
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const redirectParam = searchParams.get('redirect')
  const redirect = (redirectParam && redirectParam.startsWith('/') ? redirectParam : undefined)
    ?? (from && from.startsWith('/') ? from : undefined)
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeMethods, setChallengeMethods] = useState<TwoFactorMethodName[]>(['authenticator'])
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [passkeyOnly, setPasskeyOnly] = useState(false)

  const identifyAccount = async (email: string) => {
    if (!email.includes('@')) {
      setPasskeyOnly(false)
      return
    }

    try {
      const result = await authApi.identifyLogin({ email })
      setPasskeyOnly(Boolean(result.found && result.passkey_only))
    } catch {
      setPasskeyOnly(false)
    }
  }

  const finishAdminLogin = (user?: { role?: string; is_demo_account?: boolean }) => {
    setAdminWorkspaceMode(user?.is_demo_account ? 'demo' : 'live')
    toast({ title: 'Welcome back!', variant: 'success' })
    const target = redirect && redirect.startsWith('/admin') ? redirect : '/admin'
    navigate(target, { replace: true })
  }

  const denyNonAdmin = async (role?: string) => {
    await dispatch(logoutUser())
    const message = role === 'hr'
      ? 'HR managers should sign in at /hr.'
      : 'This portal is for administrators only. Use customer login for your account.'
    setFormError(message)
    toast({ title: 'Access denied', description: message, variant: 'destructive' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      if (passkeyOnly) {
        const result = await dispatch(verifyPasskeyPrimaryLogin({ email: form.email }))
        if (verifyPasskeyPrimaryLogin.fulfilled.match(result)) {
          const role = result.payload.user.role
          if (role !== 'admin') {
            await denyNonAdmin(role)
            return
          }
          finishAdminLogin(result.payload.user)
          return
        }
        if (verifyPasskeyPrimaryLogin.rejected.match(result)) {
          const message = typeof result.payload === 'string'
            ? result.payload
            : getApiErrorMessage(result.error, 'Passkey sign-in failed.')
          setFormError(message)
          toast({ title: 'Login failed', description: message, variant: 'destructive' })
        }
        return
      }

      const token = await getToken('login')
      const result = await dispatch(loginUser({
        credentials: { ...form, recaptcha_token: token },
        redirectTo: redirect ?? '/admin',
      }))

      if (loginUser.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'admin') {
          await denyNonAdmin(role)
          return
        }
        finishAdminLogin(result.payload.user)
        return
      }

      if (loginUser.rejected.match(result)) {
        const payload = result.payload
        if (isTwoFactorChallengePayload(payload)) {
          setChallengeToken(payload.challenge_token)
          setChallengeMethods(payload.methods ?? ['authenticator'])
          setStep('2fa')
          return
        }
        const message = typeof payload === 'string'
          ? payload
          : getApiErrorMessage(result.error, 'Invalid email or password.')
        setFormError(message)
        toast({ title: 'Login failed', description: message, variant: 'destructive' })
      }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to sign in. Please try again.')
      setFormError(message)
      toast({ title: 'Login failed', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify2fa = async (method: 'authenticator' | 'email' | 'recovery', code: string) => {
    setFormError(null)
    setSubmitting(true)
    try {
      const result = await dispatch(verify2faLogin({ challenge_token: challengeToken, code, method }))
      if (verify2faLogin.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'admin') {
          await denyNonAdmin(role)
          return
        }
        finishAdminLogin(result.payload.user)
        return
      }
      if (verify2faLogin.rejected.match(result)) {
        const message = typeof result.payload === 'string'
          ? result.payload
          : getApiErrorMessage(result.error, 'Invalid authentication code.')
        setFormError(message)
        toast({ title: 'Verification failed', description: message, variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setFormError(null)
    setSubmitting(true)
    try {
      const result = await dispatch(verifyPasskeyLogin({ challenge_token: challengeToken }))
      if (verifyPasskeyLogin.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'admin') {
          await denyNonAdmin(role)
          return
        }
        finishAdminLogin(result.payload.user)
      } else if (verifyPasskeyLogin.rejected.match(result)) {
        const message = typeof result.payload === 'string'
          ? result.payload
          : getApiErrorMessage(result.error, 'Passkey verification failed.')
        setFormError(message)
        toast({ title: 'Verification failed', description: message, variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalAuthShell
      variant="admin"
      icon={Shield}
      badge="Secure Admin"
      title="Admin sign in"
      subtitle={maintenanceEnabled
        ? 'Sign in to access the admin panel during maintenance'
        : 'Enter your administrator credentials to continue'}
      banner={maintenanceEnabled ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-amber-900 dark:text-amber-200">
            Maintenance mode is active. Only administrators can access the platform.
          </p>
        </div>
      ) : null}
      footer={(
        <p>
          Client account?{' '}
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-[var(--brand-blue)] hover:underline">
            Customer login <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      )}
    >
      <AuthFormError message={formError} />

      {step === 'credentials' ? (
        <AuthCredentialsForm
          emailId="admin-email"
          passwordId="admin-password"
          email={form.email}
          password={form.password}
          passkeyOnly={passkeyOnly}
          submitting={submitting || isLoading}
          submitLabel="Sign in to dashboard"
          onEmailChange={(email) => setForm({ ...form, email })}
          onPasswordChange={(password) => setForm({ ...form, password })}
          onEmailBlur={() => void identifyAccount(form.email)}
          onSubmit={(e) => void handleSubmit(e)}
        />
      ) : (
        <TwoFactorLoginStep
          challengeToken={challengeToken}
          methods={challengeMethods}
          code={twoFactorCode}
          onCodeChange={setTwoFactorCode}
          onSubmit={(method, code) => void handleVerify2fa(method, code)}
          onPasskeyLogin={() => void handlePasskeyLogin()}
          onBack={() => {
            setStep('credentials')
            setTwoFactorCode('')
            setChallengeToken('')
            setChallengeMethods(['authenticator'])
            setFormError(null)
          }}
          submitting={submitting || isLoading}
        />
      )}
    </PortalAuthShell>
  )
}
