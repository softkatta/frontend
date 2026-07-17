import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Lock, AlertTriangle, Mail, KeyRound, ArrowRight,
  BarChart3, Users, Settings, Sparkles, Eye, EyeOff,
} from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'
import { setAdminWorkspaceMode } from '@/services/api/client'
import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'

type TwoFactorChallengePayload = {
  code: 'REQUIRES_2FA'
  challenge_token: string
  methods?: TwoFactorMethodName[]
}

function isTwoFactorChallengePayload(payload: unknown): payload is TwoFactorChallengePayload {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'code' in payload
    && (payload as TwoFactorChallengePayload).code === 'REQUIRES_2FA'
    && 'challenge_token' in payload
  )
}
import { loginUser, logoutUser, verify2faLogin, verifyPasskeyLogin, verifyPasskeyPrimaryLogin } from '@/store/slices/authSlice'
import { authApi } from '@/services/api'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

const ADMIN_PERKS = [
  { icon: BarChart3, label: 'Revenue & reports dashboard' },
  { icon: Users, label: 'Customers, orders & subscriptions' },
  { icon: Settings, label: 'Products, content & integrations' },
]

export default function AdminLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const { enabled: maintenanceEnabled } = useMaintenanceMode()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const redirect = searchParams.get('redirect') ?? from ?? undefined
  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeMethods, setChallengeMethods] = useState<TwoFactorMethodName[]>(['authenticator'])
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [passkeyOnly, setPasskeyOnly] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    navigate(redirect ?? '/admin', { replace: true })
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
            await dispatch(logoutUser())
            const message = 'This portal is for administrators only.'
            setFormError(message)
            toast({ title: 'Access denied', description: message, variant: 'destructive' })
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

      const result = await dispatch(loginUser({ credentials: form, redirectTo: redirect ?? '/admin' }))

      if (loginUser.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (role !== 'admin') {
          await dispatch(logoutUser())
          const message = role === 'hr'
            ? 'HR managers should sign in at /hr.'
            : 'This portal is for administrators only. Use customer login for your account.'
          setFormError(message)
          toast({ title: 'Access denied', description: message, variant: 'destructive' })
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
          await dispatch(logoutUser())
          const message = 'This portal is for administrators only.'
          setFormError(message)
          toast({ title: 'Access denied', description: message, variant: 'destructive' })
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
          await dispatch(logoutUser())
          const message = 'This portal is for administrators only.'
          setFormError(message)
          toast({ title: 'Access denied', description: message, variant: 'destructive' })
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
    <div className="portal-auth portal-auth--admin public-site min-h-screen">
      <div className="portal-auth__grid min-h-screen lg:grid lg:grid-cols-2">
        <div className="portal-auth__visual relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
          <div className="portal-auth__mesh" aria-hidden />
          <div className="portal-auth__orb portal-auth__orb--1" aria-hidden />
          <div className="portal-auth__orb portal-auth__orb--2" aria-hidden />
          <div className="portal-auth__grid-lines" aria-hidden />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <BrandLogo size="lg" linkToHome />
            <span className="portal-auth__badge hidden sm:inline-flex">
              <Shield className="h-3.5 w-3.5" /> Secure Admin
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative z-10 max-w-lg my-10 lg:my-0"
          >
            <span className="portal-auth__eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Control Center
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1] text-white">
              Admin <span className="portal-auth__gradient-text">Portal</span>
            </h2>
            <p className="text-blue-100/75 text-base leading-relaxed mb-8 max-w-md">
              Manage your entire SoftKatta platform — products, billing, customers, and site content from one place.
            </p>
            <ul className="space-y-3.5">
              {ADMIN_PERKS.map(({ icon: Icon, label }, i) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="portal-auth__perk"
                >
                  <span className="portal-auth__perk-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <p className="relative z-10 text-xs text-blue-100/50 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Authorized personnel only · Encrypted session
          </p>
        </div>

        <div className="portal-auth__form-panel relative flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
          <div className="portal-auth__form-glow" aria-hidden />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[420px]"
          >
            <div className="portal-auth__card">
              <div className="portal-auth__card-beam" aria-hidden />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl portal-auth__icon-wrap mb-6 mx-auto lg:mx-0">
                <Shield className="h-7 w-7 text-white" />
              </div>

              <div className="text-center lg:text-left mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Admin sign in</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {maintenanceEnabled
                    ? 'Sign in to access the admin panel during maintenance'
                    : 'Enter your administrator credentials to continue'}
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {maintenanceEnabled && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-amber-900 dark:text-amber-200">
                    Maintenance mode is active. Only administrators can access the platform.
                  </p>
                </div>
              )}

              {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email address</Label>
                  <div className="portal-auth__input-wrap">
                    <Mail className="portal-auth__input-icon h-4 w-4" />
                    <Input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="username"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onBlur={() => void identifyAccount(form.email)}
                      className="portal-auth__input h-12 rounded-xl pl-10"
                    />
                  </div>
                </div>
                {!passkeyOnly ? (
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="portal-auth__input-wrap">
                    <KeyRound className="portal-auth__input-icon h-4 w-4" />
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  disabled={submitting || isLoading}
                  className="portal-auth__submit glow-btn w-full py-3.5 rounded-full text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {submitting || isLoading ? 'Signing in...' : (
                    <>
                      {passkeyOnly ? 'Continue with Passkey' : 'Sign in to dashboard'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
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

              <p className="text-center text-sm text-muted-foreground mt-8 pt-6 border-t border-[var(--border)]">
                Client account?{' '}
                <Link to="/login" className="text-[var(--brand-blue)] font-semibold hover:underline inline-flex items-center gap-1">
                  Customer login <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
