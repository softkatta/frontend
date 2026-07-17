import { Link, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { AuthCredentialsForm } from '@/components/auth/AuthCredentialsForm'
import { AuthFormError } from '@/components/auth/AuthFormError'
import { PortalAuthShell } from '@/components/auth/PortalAuthShell'
import { isTwoFactorChallengePayload } from '@/lib/authChallenge'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { loginUser } from '@/store/slices/authSlice'
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
          toast({
            title: 'Use the correct portal',
            description: role === 'admin'
              ? 'Super admins should sign in at /admin.'
              : role === 'employee'
                ? 'Employees should sign in at /employee.'
                : 'This login is for HR managers only.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Welcome!', variant: 'success' })
        navigate('/hr', { replace: true })
      } else {
        const payload = result.payload
        if (isTwoFactorChallengePayload(payload)) {
          setFormError('Two-factor authentication is required. Contact your administrator.')
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
    </PortalAuthShell>
  )
}
