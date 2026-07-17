import { Link, useNavigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { loginUser } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function EmployeeLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
        if (role !== 'employee') {
          toast({ title: 'Use the correct portal', description: 'This login is for employees only.', variant: 'destructive' })
          return
        }
        toast({ title: 'Welcome!', variant: 'success' })
        navigate('/employee', { replace: true })
      } else {
        const payload = result.payload
        if (isTwoFactorChallengePayload(payload)) {
          setFormError('Two-factor authentication is required. Contact HR to reset your portal access.')
        } else {
          setFormError(typeof payload === 'string' ? payload : 'Invalid email or password.')
        }
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Login failed.'))
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
    </PortalAuthShell>
  )
}
