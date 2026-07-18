import { Link, useNavigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'
import { loginUser, verify2faLogin, verifyPasskeyLogin } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function EmployeeLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const { getToken } = useRecaptcha('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeMethods, setChallengeMethods] = useState<TwoFactorMethodName[]>(['authenticator'])
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const finishLogin = () => {
    toast({ title: 'Welcome!', variant: 'success' })
    navigate('/employee', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const credentials = {
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        recaptcha_token: await getToken('login'),
      }
      const result = await dispatch(loginUser({ credentials }))
      if (loginUser.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'employee') {
          toast({ title: 'Use the correct portal', description: 'This login is for employees only.', variant: 'destructive' })
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
        if (result.payload.user.role !== 'employee') {
          toast({ title: 'Use the correct portal', description: 'This login is for employees only.', variant: 'destructive' })
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
        if (result.payload.user.role !== 'employee') {
          toast({ title: 'Use the correct portal', description: 'This login is for employees only.', variant: 'destructive' })
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
      variant="employee"
      icon={Briefcase}
      badge="Employee Portal"
      title="Employee portal"
      subtitle="Leave, attendance, documents & profile"
      footer={(
        <p className="text-xs">
          Customer?{' '}
          <Link to="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Client login
          </Link>
        </p>
      )}
    >
      <AuthFormError message={formError} />
      {step === 'credentials' ? (
        <AuthCredentialsForm
          emailId="employee-email"
          passwordId="employee-password"
          email={form.email}
          password={form.password}
          submitting={submitting || isLoading}
          emailLabel="Work email"
          submitLabel="Sign in to employee portal"
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
