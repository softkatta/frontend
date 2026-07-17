import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { TypewriterText } from '@/components/common/TypewriterText'
import { HeroPathAnimation } from '@/components/common/HeroPathAnimation'
import { hasHeroBootCompleted, MonitorHero } from '@/components/common/MonitorHero'
import { useSiteContent } from '@/hooks/useSiteContent'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { cn } from '@/lib/utils'

const HomeBelowFold = lazy(() => import('./HomeBelowFold'))

export default function HomePage() {
  const { page } = usePublicPageContent('home')
  const { heroSlides } = useSiteContent('hero')
  const [heroCached] = useState(hasHeroBootCompleted)
  const trustItems = page.trust_items ?? []
  const heroBadges = page.hero_badges ?? []
  const typewriterPhrases = page.typewriter_phrases ?? []

  return (
    <div>
      <section className="hero-cyber hero-stylish relative pt-14 pb-24 sm:pt-18 sm:pb-32 overflow-hidden min-h-[90vh] flex items-center">
        <div className="aurora-bg absolute inset-0 pointer-events-none" aria-hidden />
        <div className="hero-cyber-backdrop absolute inset-0 pointer-events-none opacity-80" aria-hidden />
        <div className="hero-horizon-glow" aria-hidden />
        <HeroPathAnimation />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={cn('hero-copy max-w-xl', !heroCached && 'hero-content-enter')}>
              {page.label && (
                <p className="hero-eyebrow">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--brand-teal)]" aria-hidden />
                  <span>{page.label}</span>
                </p>
              )}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
                <span className="block text-[var(--text-hero,var(--foreground))]">{page.title}</span>
                {(typewriterPhrases.length > 0 || page.highlight) && (
                  <span className="block mt-2 min-h-[1.15em]">
                    {typewriterPhrases.length > 0 ? (
                      <TypewriterText phrases={typewriterPhrases} />
                    ) : (
                      <span className="text-brand-gradient">{page.highlight}</span>
                    )}
                  </span>
                )}
              </h1>
              {page.description && (
                <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">{page.description}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/products" className="hero-cta-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base rounded-full">
                  Visit Software Shop <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/register" className="hero-cta-ghost inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base rounded-full">
                  Create Free Account
                </Link>
              </div>
              {heroBadges.length > 0 && (
                <ul className="hero-badge-list">
                  {heroBadges.map((item) => (
                    <li key={item}>
                      <CheckCircle className="h-4 w-4 shrink-0 text-[var(--brand-teal)]" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <MonitorHero slides={heroSlides} />
          </div>
        </div>
      </section>

      <div className="border-y border-[var(--border)] py-4 overflow-hidden mask-fade-x bg-[rgba(30,64,175,0.04)]">
        <div className="flex animate-marquee whitespace-nowrap gap-12">
          {[...trustItems, ...trustItems].map((t, i) => (
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
