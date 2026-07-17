import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, LogIn } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { useAuth } from '@/hooks/useAuth'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { authApi } from '@/services/api'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'
import { loginUser, verify2faLogin, verifyPasskeyLogin, verifyPasskeyPrimaryLogin } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? undefined
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

  const finishLogin = (role: string) => {
    toast({ title: 'Welcome back!', variant: 'success' })
    if (redirect) {
      navigate(redirect)
    } else if (role === 'admin') {
      navigate('/admin')
    } else if (role === 'employee') {
      navigate('/employee')
    } else if (role === 'hr') {
      navigate('/hr')
    } else {
      navigate('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      if (passkeyOnly) {
        const result = await dispatch(verifyPasskeyPrimaryLogin({ email: form.email }))
        if (verifyPasskeyPrimaryLogin.fulfilled.match(result)) {
          finishLogin(result.payload.user.role)
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

      const result = await dispatch(loginUser({ credentials: form, redirectTo: redirect }))
      if (loginUser.fulfilled.match(result)) {
        finishLogin(result.payload.user.role)
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
        finishLogin(result.payload.user.role)
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
        finishLogin(result.payload.user.role)
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

  const subtitle = redirect
    ? 'Sign in to continue your purchase'
    : 'Sign in to manage subscriptions, invoices, and your account'

  return (
    <PortalAuthShell
      variant="client"
      icon={LogIn}
      badge="Customer Portal"
      title="Welcome back"
      subtitle={subtitle}
      footer={(
        <>
          <p>
            No account?{' '}
            <Link
              to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
              className="inline-flex items-center gap-1 font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Create free account <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
          <p className="text-xs">
            SoftKatta employee?{' '}
            <Link to="/employee" className="font-semibold text-[var(--brand-blue)] hover:underline">
              Employee portal login
            </Link>
          </p>
          <p className="text-xs">
            Administrator?{' '}
            <Link to="/admin" className="font-semibold text-[var(--brand-blue)] hover:underline">
              Admin login
            </Link>
          </p>
        </>
      )}
    >
      <AuthFormError message={formError} />

      {step === 'credentials' ? (
        <AuthCredentialsForm
          email={form.email}
          password={form.password}
          passkeyOnly={passkeyOnly}
          submitting={submitting || isLoading}
          submitLabel="Sign in to account"
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
