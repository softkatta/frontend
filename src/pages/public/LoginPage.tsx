import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogIn, Lock, Mail, KeyRound, ArrowRight, Sparkles, AlertTriangle,
  Receipt, Zap, Headphones,
} from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
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
import { loginUser, verify2faLogin, verifyPasskeyLogin, verifyPasskeyPrimaryLogin } from '@/store/slices/authSlice'
import { authApi } from '@/services/api'
import { useAppDispatch } from '@/store/hooks'
import { TwoFactorLoginStep } from '@/components/auth/TwoFactorLoginStep'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'

const CLIENT_PERKS = [
  { icon: Receipt, label: 'GST invoice support on every purchase' },
  { icon: Zap, label: 'Instant activation after checkout' },
  { icon: Headphones, label: '24/7 customer support' },
]

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
    } else {
      navigate(role === 'admin' || role === 'staff' ? '/admin' : '/dashboard')
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
    <div className="portal-auth portal-auth--client public-site min-h-screen">
      <div className="portal-auth__grid min-h-screen lg:grid lg:grid-cols-2">
        <div className="portal-auth__visual relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
          <div className="portal-auth__mesh" aria-hidden />
          <div className="portal-auth__orb portal-auth__orb--1" aria-hidden />
          <div className="portal-auth__orb portal-auth__orb--2" aria-hidden />
          <div className="portal-auth__grid-lines" aria-hidden />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <BrandLogo size="lg" linkToHome />
            <span className="portal-auth__badge hidden sm:inline-flex">
              <LogIn className="h-3.5 w-3.5" /> Customer Portal
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative z-10 max-w-lg my-10 lg:my-0"
          >
            <span className="portal-auth__eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Your Account
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1] text-white">
              Sign in to <span className="portal-auth__gradient-text">Buy & Subscribe</span>
            </h2>
            <p className="text-blue-100/75 text-base leading-relaxed mb-8 max-w-md">
              Access your dashboard, manage subscriptions, download GST invoices, and complete checkout securely.
            </p>
            <ul className="space-y-3.5">
              {CLIENT_PERKS.map(({ icon: Icon, label }, i) => (
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
            <Lock className="h-3.5 w-3.5" /> Secured with 256-bit encryption
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
                <LogIn className="h-7 w-7 text-white" />
              </div>

              <div className="text-center lg:text-left mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>
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

              {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="portal-auth__input-wrap">
                    <Mail className="portal-auth__input-icon h-4 w-4" />
                    <Input
                      id="email"
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
                  <Label htmlFor="password">Password</Label>
                  <div className="portal-auth__input-wrap">
                    <KeyRound className="portal-auth__input-icon h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="portal-auth__input h-12 rounded-xl pl-10"
                    />
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
                      {passkeyOnly ? 'Continue with Passkey' : 'Sign in to account'}
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
                No account?{' '}
                <Link
                  to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
                  className="text-[var(--brand-blue)] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Create free account <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Administrator?{' '}
                <Link to="/admin" className="text-[var(--brand-blue)] font-semibold hover:underline">
                  Admin login
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
