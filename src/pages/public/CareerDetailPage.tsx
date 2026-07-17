import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { careersApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { formatEmploymentType, mapPublicCareer } from '@/lib/apiMappers'
import { mailtoHref } from '@/lib/companyContact'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { usePageSeo } from '@/hooks/usePageSeo'
import type { CareerOpening } from '@/types'

type DetailTab = 'overview' | 'requirements'

const APPLY_STEPS = [
  'Submit your application with resume',
  'Our team reviews within 3–5 business days',
  'Shortlisted candidates get a call or interview invite',
]

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
}

export default function CareerDetailPage() {
  const { slug } = useParams()
  const { supportEmail } = useSiteBranding()
  const [job, setJob] = useState<CareerOpening | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  useEffect(() => {
    if (!slug) return
    void (async () => {
      setLoading(true)
      try {
        const data = mapPublicCareer(await careersApi.get(slug))
        setJob(data)
        setNotFound(false)
        setActiveTab('overview')
      } catch {
        setNotFound(true)
        setJob(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const emailHref = useMemo(
    () => (job ? mailtoHref(job.apply_email ?? supportEmail) : undefined),
    [job, supportEmail],
  )

  usePageSeo(job && slug ? {
    title: `${job.title} — Careers | SoftKatta Solutions`,
    description: job.excerpt || job.description?.slice(0, 160) || `Apply for ${job.title} at SoftKatta Solutions.`,
    path: `/careers/${slug}`,
  } : null)

  const tabs = useMemo(() => {
    if (!job) return []
    const items: { key: DetailTab; label: string; show: boolean }[] = [
      { key: 'overview', label: 'Role overview', show: Boolean(job.description) },
      { key: 'requirements', label: 'Requirements', show: Boolean(job.requirements) },
    ]
    return items.filter((t) => t.show)
  }, [job])

  if (loading) {
    return (
      <div className="career-detail-page">
        <div className="career-detail-page__bg" aria-hidden />
        <div className="min-h-[60vh] flex items-center justify-center relative z-10">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (notFound || !job || !slug) {
    return (
      <div className="career-detail-page">
        <div className="career-detail-page__bg" aria-hidden />
        <div className="min-h-[60vh] flex items-center relative z-10">
          <div className="text-center w-full max-w-md mx-auto px-4">
            <h1 className="font-display text-2xl font-bold mb-3">Position not found</h1>
            <p className="text-sm text-muted-foreground mb-6">This role may have been filled or removed.</p>
            <Link to="/careers" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full">
              <ArrowLeft className="h-4 w-4" /> Back to Careers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="career-detail-page">
      <div className="career-detail-page__bg" aria-hidden />

      <section className="relative overflow-hidden pt-24 pb-8 sm:pb-10">
        <div className="career-detail-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          <motion.nav {...fadeUp} className="career-detail-page__crumb mb-6">
            <Link to="/careers">
              <ArrowLeft className="h-4 w-4" /> Back to Careers
            </Link>
          </motion.nav>

          <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="lg:hidden mb-6">
            <span className="section-label mb-3 inline-block">Open Position</span>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full">{formatEmploymentType(job.employment_type)}</Badge>
              {job.department && (
                <span className="career-detail-page__meta-pill">
                  <Building2 className="h-3.5 w-3.5" /> {job.department}
                </span>
              )}
              {job.location && (
                <span className="career-detail-page__meta-pill">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="career-detail-page__split">
            {/* Left: sticky apply panel */}
            <motion.aside
              {...fadeUp}
              transition={{ delay: 0.06 }}
              className="career-detail-page__sidebar"
            >
              <div className="career-detail-page__apply-panel">
                <div className="career-detail-page__apply-glow" aria-hidden />

                <div className="hidden lg:block">
                  <span className="section-label mb-3 inline-block">Open Position</span>
                  <h1 className="font-display text-2xl xl:text-3xl font-bold tracking-tight mb-4 leading-tight">
                    {job.title}
                  </h1>
                </div>

                <div className="hidden lg:flex flex-wrap items-center gap-2 mb-5">
                  <Badge variant="outline" className="rounded-full">{formatEmploymentType(job.employment_type)}</Badge>
                  {job.department && (
                    <span className="career-detail-page__meta-pill">
                      <Building2 className="h-3.5 w-3.5" /> {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className="career-detail-page__meta-pill">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                </div>

                {job.excerpt && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 hidden lg:block">
                    {job.excerpt}
                  </p>
                )}

                {job.experience_required && (
                  <p className="text-sm text-muted-foreground mb-2">Experience: {job.experience_required}</p>
                )}
                {job.salary_display && (
                  <p className="text-sm font-medium text-[var(--brand-teal)] mb-4">Salary: {job.salary_display}</p>
                )}

                <div className="space-y-2.5">
                  <Link to={`/careers/${slug}/apply`} className="career-detail-page__apply-btn w-full">
                    <Send className="h-4 w-4" />
                    Apply for this role
                  </Link>
                  {emailHref && (
                    <a href={emailHref} className="career-detail-page__email-btn w-full">
                      <Mail className="h-4 w-4" />
                      Email HR
                    </a>
                  )}
                </div>

                <div className="career-detail-page__steps">
                  <p className="career-detail-page__steps-title">
                    <Sparkles className="h-4 w-4 text-[var(--brand-teal)]" />
                    What happens next
                  </p>
                  <ol className="career-detail-page__steps-list">
                    {APPLY_STEPS.map((step) => (
                      <li key={step}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--brand-teal)]" />
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.aside>

            {/* Right: job content */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.1 }}
              className="career-detail-page__content"
            >
              {job.excerpt && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 lg:hidden">
                  {job.excerpt}
                </p>
              )}

              <div className="lg:hidden flex flex-col sm:flex-row gap-2.5 mb-6">
                <Link to={`/careers/${slug}/apply`} className="career-detail-page__apply-btn flex-1">
                  <Send className="h-4 w-4" />
                  Apply for this role
                </Link>
                {emailHref && (
                  <a href={emailHref} className="career-detail-page__email-btn flex-1">
                    <Mail className="h-4 w-4" />
                    Email HR
                  </a>
                )}
              </div>

              {tabs.length > 1 && (
                <div className="career-detail-page__tabs" role="tablist">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === key}
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        'career-detail-page__tab',
                        activeTab === key && 'career-detail-page__tab--active',
                      )}
                    >
                      {key === 'overview' ? <Briefcase className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="career-detail-page__card">
                {(activeTab === 'overview' || tabs.length <= 1) && job.description && (
                  <section>
                    <h2 className="career-detail-page__section-title">
                      <Briefcase className="h-5 w-5 text-[var(--brand-blue)]" />
                      Role Overview
                    </h2>
                    <div className="career-detail-page__prose">{job.description}</div>
                  </section>
                )}

                {activeTab === 'requirements' && job.requirements && (
                  <section>
                    <h2 className="career-detail-page__section-title">
                      <ClipboardList className="h-5 w-5 text-[var(--brand-blue)]" />
                      Requirements
                    </h2>
                    <div className="career-detail-page__prose">{job.requirements}</div>
                  </section>
                )}

                {tabs.length === 1 && activeTab === 'overview' && !job.description && job.requirements && (
                  <section>
                    <h2 className="career-detail-page__section-title">
                      <ClipboardList className="h-5 w-5 text-[var(--brand-blue)]" />
                      Requirements
                    </h2>
                    <div className="career-detail-page__prose">{job.requirements}</div>
                  </section>
                )}
              </div>

              <div className="career-detail-page__cta">
                <div className="career-detail-page__cta-glow" aria-hidden />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-display font-bold text-lg">Ready to join us?</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Apply now — we&apos;d love to hear from you.</p>
                  </div>
                  <Link to={`/careers/${slug}/apply`} className="career-detail-page__apply-btn shrink-0">
                    <Send className="h-4 w-4" />
                    Apply for this role
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
