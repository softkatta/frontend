import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { TypewriterText } from '@/components/common/TypewriterText'
import { HeroPathAnimation } from '@/components/common/HeroPathAnimation'
import { hasHeroBootCompleted, MonitorHero } from '@/components/common/MonitorHero'
import { useSiteContent } from '@/hooks/useSiteContent'
import { cn } from '@/lib/utils'

const HomeBelowFold = lazy(() => import('./HomeBelowFold'))

const TRUST = ['GST Ready', 'Udyam MSME', 'Shop Act', 'Secure Cloud']
const TYPEWRITER_PHRASES = ['One Cloud', 'Your Business', 'Smart Software']

export default function HomePage() {
  const { heroSlides } = useSiteContent('hero')
  const [heroCached] = useState(hasHeroBootCompleted)

  return (
    <div>
      <section className="hero-cyber hero-stylish relative pt-14 pb-24 sm:pt-18 sm:pb-32 overflow-hidden min-h-[90vh] flex items-center">
        <div className="aurora-bg absolute inset-0 pointer-events-none" aria-hidden />
        <div className="hero-cyber-backdrop absolute inset-0 pointer-events-none opacity-80" aria-hidden />
        <div className="hero-horizon-glow" aria-hidden />
        <HeroPathAnimation />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={cn(!heroCached && 'hero-content-enter')}>
              <span className="inline-flex items-center gap-2 section-label mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
                India&apos;s Multi-Product SaaS Platform
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold leading-[0.95] tracking-tight mb-6">
                Run Your Business on{' '}
                <br className="hidden sm:block" />
                <TypewriterText phrases={TYPEWRITER_PHRASES} />
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                ERP, POS, CRM & HR — built for Indian SMEs. Subscribe instantly, pay with GST invoice, scale without limits.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/products" className="hero-cta-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-sm sm:text-base rounded-full">
                  Visit Software Shop <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/register" className="hero-cta-ghost inline-flex items-center justify-center gap-2 px-8 py-4 text-sm sm:text-base rounded-full">
                  Create Free Account
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {['GST invoices', 'Instant activation', 'Secure checkout', '24/7 support'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-[var(--brand-teal)]" /> {t}
                  </span>
                ))}
              </div>
            </div>

            <MonitorHero slides={heroSlides} />
          </div>
        </div>
      </section>

      <div className="border-y border-[var(--border)] py-4 overflow-hidden mask-fade-x bg-[rgba(30,64,175,0.04)]">
        <div className="flex animate-marquee whitespace-nowrap gap-12">
          {[...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      <Suspense fallback={<div className="min-h-[40vh]" aria-hidden />}>
        <HomeBelowFold />
      </Suspense>
    </div>
  )
}
