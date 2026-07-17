import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, Users } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginUser } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

export default function HrLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        if (typeof payload === 'object' && payload !== null && 'code' in payload && payload.code === 'REQUIRES_2FA') {
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandLogo className="h-10 mb-4" />
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">HR portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Hiring, employees, leave & attendance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hr-email">Work email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="hr-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hr-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="hr-password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 rounded-xl" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <button type="submit" disabled={submitting || isLoading} className="hero-cta-primary w-full h-11 rounded-xl text-sm font-semibold">
            {submitting ? 'Signing in…' : 'Sign in to HR portal'}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6 space-x-2">
          <Link to="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">Client login</Link>
          <span>·</span>
          <Link to="/employee" className="text-[var(--brand-blue)] font-semibold hover:underline">Employee login</Link>
        </p>
      </div>
    </div>
  )
}
