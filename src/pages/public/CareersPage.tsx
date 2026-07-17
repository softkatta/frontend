import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  MapPin,
  Building2,
  Users,
  Rocket,
  HeartHandshake,
  Sparkles,
  Mail,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { careersApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatEmploymentType, mapPublicCareer } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import type { CareerOpening } from '@/types'

const PERK_ICONS = [Rocket, Users, HeartHandshake, Sparkles] as const

export default function CareersPage() {
  const { page } = usePublicPageContent('careers')
  const PERKS = page.perks ?? []
  const [openings, setOpenings] = useState<CareerOpening[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = unwrapList(await careersApi.list()).map(mapPublicCareer)
        setOpenings(data)
      } catch (err) {
        toast({ title: 'Failed to load career openings', description: getApiErrorMessage(err), variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const departments = useMemo(
    () => [...new Set(openings.map((job) => job.department).filter(Boolean))],
    [openings],
  )

  return (
    <div className="careers-page">
      <div className="careers-page__bg" aria-hidden />

      <section className="careers-page__hero relative overflow-hidden pt-24 pb-8 sm:pb-10">
        <div className="careers-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="section-label mb-4 inline-block">{page.label}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
              {page.title}{' '}
              {page.highlight && <span className="text-gradient-brand">{page.highlight}</span>}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{page.description}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="careers-page__split">
            {/* Left: visual panel */}
            <aside className="careers-page__visual">
              <div className="careers-page__visual-inner">
                <div className="careers-page__visual-art" aria-hidden>
                  <div className="careers-page__visual-art-bg" />
                  <div className="careers-page__visual-art-grid" />
                  <div className="careers-page__visual-art-orb careers-page__visual-art-orb--1" />
                  <div className="careers-page__visual-art-orb careers-page__visual-art-orb--2" />
                  <div className="careers-page__visual-art-icons">
                    <div className="careers-page__visual-icon careers-page__visual-icon--1">
                      <Briefcase className="h-7 w-7" />
                    </div>
                    <div className="careers-page__visual-icon careers-page__visual-icon--2">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="careers-page__visual-icon careers-page__visual-icon--3">
                      <Rocket className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="careers-page__visual-art-caption">
                    Your next chapter starts here
                  </p>
                </div>

                {!loading && (
                  <div className="careers-page__stats">
                    <div className="careers-page__stat">
                      <span className="careers-page__stat-value">{openings.length}</span>
                      <span className="careers-page__stat-label">Open roles</span>
                    </div>
                    <div className="careers-page__stat">
                      <span className="careers-page__stat-value">{departments.length || '—'}</span>
                      <span className="careers-page__stat-label">Departments</span>
                    </div>
                  </div>
                )}

                <ul className="careers-page__perks">
                  {PERKS.map(({ title, text }, i) => {
                    const Icon = PERK_ICONS[i % PERK_ICONS.length]
                    return (
                    <li key={title} className="careers-page__perk">
                      <div className="careers-page__perk-icon">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="careers-page__perk-title">{title}</p>
                        <p className="careers-page__perk-text">{text}</p>
                      </div>
                    </li>
                    )
                  })}
                </ul>

                <Link to="/contact" className="careers-page__contact-link">
                  <Mail className="h-4 w-4" />
                  Questions? Contact us
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </div>
            </aside>

            {/* Right: job listings */}
            <div className="careers-page__list">
              <div className="careers-page__list-header">
                <h2 className="font-display font-bold text-xl sm:text-2xl">Open positions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading ? 'Loading roles…' : openings.length === 0 ? 'No openings right now' : `${openings.length} role${openings.length === 1 ? '' : 's'} available`}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : openings.length === 0 ? (
                <div className="careers-page__empty">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="font-semibold mb-1">No open positions right now</p>
                  <p className="text-sm text-muted-foreground mb-6">Check back soon — we&apos;re always growing.</p>
                  <Link to="/contact" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
                    Get in touch <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="careers-page__jobs">
                  {openings.map((job, i) => (
                    <motion.article
                      key={job.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="careers-page__job-card group"
                    >
                      <div className="careers-page__job-card-accent" aria-hidden />
                      <div className="careers-page__job-card-body">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline" className="rounded-full">
                            {formatEmploymentType(job.employment_type)}
                          </Badge>
                          {job.department && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" /> {job.department}
                            </span>
                          )}
                          {job.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {job.location}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-lg sm:text-xl mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
                          {job.title}
                        </h3>
                        {job.excerpt && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                            {job.excerpt}
                          </p>
                        )}
                        {(job.experience_required || job.salary_display) && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                            {job.experience_required && <span>Exp: {job.experience_required}</span>}
                            {job.salary_display && <span className="text-[var(--brand-teal)] font-medium">{job.salary_display}</span>}
                          </div>
                        )}
                        <Link
                          to={`/careers/${job.slug}`}
                          className="careers-page__job-link"
                        >
                          View role & apply
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
