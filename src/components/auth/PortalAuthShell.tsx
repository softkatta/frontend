import type { LucideIcon } from 'lucide-react'
import { Check, Lock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/common/BrandLogo'
import { cn } from '@/lib/utils'

export type PortalAuthVariant = 'client' | 'admin' | 'employee' | 'hr'

interface PortalAuthShellProps {
  variant: PortalAuthVariant
  icon: LucideIcon
  badge?: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
  banner?: React.ReactNode
  className?: string
}

const portalVisuals: Record<PortalAuthVariant, {
  image: string
  eyebrow: string
  heading: string
  description: string
  highlights: string[]
}> = {
  client: {
    image: '/images/auth/login-client.webp',
    eyebrow: 'Customer workspace',
    heading: 'Everything you need, in one secure place.',
    description: 'Manage subscriptions, invoices, licenses and support from your SoftKatta account.',
    highlights: ['Instant product access', 'GST-ready billing', 'Secure account management'],
  },
  admin: {
    image: '/images/auth/login-admin.webp',
    eyebrow: 'Control center',
    heading: 'Lead your platform with clarity.',
    description: 'A protected workspace for managing customers, products, billing and operations.',
    highlights: ['Live business insights', 'Granular access control', 'Centralized operations'],
  },
  employee: {
    image: '/images/auth/login-employee.webp',
    eyebrow: 'Your workspace',
    heading: 'Stay organized. Move work forward.',
    description: 'Access your tasks, attendance, leave, documents and team updates from one place.',
    highlights: ['Daily work overview', 'Easy leave management', 'Secure employee records'],
  },
  hr: {
    image: '/images/auth/login-hr.webp',
    eyebrow: 'People operations',
    heading: 'Build a better employee experience.',
    description: 'Manage hiring, attendance, leave and your team with a modern HR workspace.',
    highlights: ['Connected employee data', 'Smarter hiring workflows', 'Clear workforce insights'],
  },
}

export function PortalAuthShell({
  variant,
  icon: Icon,
  badge,
  title,
  subtitle,
  children,
  footer,
  banner,
  className,
}: PortalAuthShellProps) {
  const visual = portalVisuals[variant]

  return (
    <div className={cn('portal-auth portal-auth--split public-site min-h-screen', `portal-auth--${variant}`, className)}>
      <section className="portal-auth__image-panel">
        <img
          src={visual.image}
          alt=""
          className="portal-auth__image"
          aria-hidden="true"
        />
        <div className="portal-auth__image-overlay" aria-hidden />
        <div className="portal-auth__image-grid" aria-hidden />

        <div className="relative z-10 flex h-full flex-col justify-between p-7 sm:p-10 lg:p-12">
          <BrandLogo size="lg" linkToHome />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="portal-auth__image-copy"
          >
            <span className="portal-auth__image-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              {visual.eyebrow}
            </span>
            <h2>{visual.heading}</h2>
            <p>{visual.description}</p>
            <ul>
              {visual.highlights.map((highlight) => (
                <li key={highlight}>
                  <span><Check className="h-3.5 w-3.5" /></span>
                  {highlight}
                </li>
              ))}
            </ul>
          </motion.div>

          <p className="relative z-10 hidden items-center gap-1.5 text-xs text-white/55 lg:flex">
            <Lock className="h-3.5 w-3.5" /> Protected by encrypted authentication
          </p>
        </div>
      </section>

      <main className="portal-auth__form-side">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="portal-auth__mobile-brand"
        >
          <BrandLogo size="md" linkToHome />
          {badge ? (
            <span className="portal-auth__minimal-badge">
              <Icon className="h-3.5 w-3.5" />
              {badge}
            </span>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="w-full max-w-[420px]"
        >
          <div className="portal-auth__card portal-auth__card--centered">
            <div className="portal-auth__card-beam" aria-hidden />

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl portal-auth__icon-wrap">
              <Icon className="h-7 w-7 text-white" />
            </div>

            <div className="mb-7 text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            {banner}
            {children}

            {footer ? (
              <div className="mt-8 space-y-3 border-t border-[var(--border)] pt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </motion.div>

        <p className="relative z-10 mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Secured with encrypted session
        </p>
      </main>
    </div>
  )
}
