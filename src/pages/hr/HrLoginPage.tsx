import { Link, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'
import { loginUser, verify2faLogin, verifyPasskeyLogin } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function HrLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeMethods, setChallengeMethods] = useState<TwoFactorMethodName[]>(['authenticator'])
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const finishLogin = () => {
    toast({ title: 'Welcome!', variant: 'success' })
    navigate('/hr', { replace: true })
  }

  const denyWrongPortal = (role?: string) => {
    toast({
      title: 'Use the correct portal',
      description: role === 'admin'
        ? 'Super admins should sign in at /admin.'
        : role === 'employee'
          ? 'Employees should sign in at /employee.'
          : 'This login is for HR managers only.',
      variant: 'destructive',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const credentials = {
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      }
      const result = await dispatch(loginUser({ credentials }))
      if (loginUser.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'hr') {
          denyWrongPortal(role)
          return
        }
        finishLogin()
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
        setFormError(typeof payload === 'string' ? payload : 'Invalid email or password.')
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Login failed.'))
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
        if (result.payload.user.role !== 'hr') {
          denyWrongPortal(result.payload.user.role)
          return
        }
        finishLogin()
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
        if (result.payload.user.role !== 'hr') {
          denyWrongPortal(result.payload.user.role)
          return
        }
        finishLogin()
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
      variant="hr"
      icon={Users}
      badge="HR Portal"
      title="HR portal"
      subtitle="Hiring, employees, leave & attendance"
      footer={(
        <p className="text-xs space-x-2">
          <Link to="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">Client login</Link>
          <span>·</span>
          <Link to="/employee" className="font-semibold text-[var(--brand-blue)] hover:underline">Employee login</Link>
        </p>
      )}
    >
      <AuthFormError message={formError} />
      {step === 'credentials' ? (
        <AuthCredentialsForm
          emailId="hr-email"
          passwordId="hr-password"
          email={form.email}
          password={form.password}
          submitting={submitting || isLoading}
          emailLabel="Work email"
          submitLabel="Sign in to HR portal"
          onEmailChange={(email) => setForm({ ...form, email })}
          onPasswordChange={(password) => setForm({ ...form, password })}
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
