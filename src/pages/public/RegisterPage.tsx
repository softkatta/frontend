import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { registerUser } from '@/store/slices/authSlice'
import { toast } from '@/components/ui/toaster'
import { useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiHelpers'

const PERKS = ['Required before purchase', 'Instant shop access', 'Manage subscriptions']

export default function RegisterPage() {
  const { register, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? undefined
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', company: '', phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phone = form.phone.replace(/\D/g, '')
    if (phone && phone.length !== 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Enter a 10-digit mobile number or leave phone blank.',
        variant: 'destructive',
      })
      return
    }

    if (!avatarFile) {
      toast({
        title: 'Profile photo required',
        description: 'Upload a JPG, PNG, or WEBP image up to 2MB.',
        variant: 'destructive',
      })
      return
    }

    const result = await register(
      { ...form, phone, avatar: avatarFile },
      redirect,
    )
    if (registerUser.fulfilled.match(result)) {
      toast({ title: 'Account created!', description: 'You can now buy products from the shop.', variant: 'success' })
    } else {
      const message = typeof result.payload === 'string'
        ? result.payload
        : getApiErrorMessage(result.error, 'Please check your details and try again.')
      toast({ title: 'Registration failed', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="auth-page min-h-[90vh] grid lg:grid-cols-2">
      <div className="auth-page__visual relative hidden lg:flex flex-col justify-between p-12 overflow-hidden hero-cyber">
        <div className="aurora-bg absolute inset-0" aria-hidden />
        <div className="hero-horizon-glow opacity-50" aria-hidden />
        <div className="relative z-10">
          <BrandLogo size="lg" linkToHome />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold tracking-tight mb-4 leading-tight">
            Create account to <span className="text-brand-gradient">shop & buy</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Account is required before adding to cart or checkout.
          </p>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm">
                <CheckCircle className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
        <p className="relative z-10 text-xs text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" /> Your data stays in India-compliant servers
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 bg-[var(--background)]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="auth-card premium-card p-8 sm:p-10 shadow-glow-md rounded-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-teal)]/15 mb-6 lg:hidden mx-auto">
              <UserPlus className="h-6 w-6 text-[var(--brand-teal)]" />
            </div>
            <div className="text-center lg:text-left mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Create Account</h1>
              <p className="text-sm text-muted-foreground mt-2">Free to register · Required for cart & checkout</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Photo</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 2MB.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" required placeholder="John" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" required placeholder="Doe" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" required placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-11 rounded-xl pr-10"
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Acme Corp" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Optional. Must be exactly 10 digits if provided.</p>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="glow-btn w-full py-3.5 rounded-full text-sm font-semibold disabled:opacity-50 mt-2">
                {isLoading ? 'Creating account...' : 'Create Account & Continue'}
              </button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Already have an account?{' '}
              <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} className="text-[var(--brand-blue)] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
