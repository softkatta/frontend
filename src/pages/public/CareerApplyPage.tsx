import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileUp, Send, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { careersApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { mapPublicCareer } from '@/lib/apiMappers'
import { ACCEPTED_FILE_TYPES, APPLICATION_DOCUMENTS, type ApplicationDocumentKey } from '@/lib/hrConstants'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import { toast } from '@/components/ui/toaster'
import type { CareerOpening } from '@/types'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'prefer_not_to_say',
  current_address: '',
  permanent_address: '',
  qualification: '',
  skills: '',
  total_experience: '',
  current_company: '',
  current_salary: '',
  expected_salary: '',
  notice_period: '',
  preferred_location: '',
  message: '',
}

type FileState = Record<string, File | null>

export default function CareerApplyPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { getToken } = useRecaptcha('career_apply')
  const [job, setJob] = useState<CareerOpening | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [files, setFiles] = useState<FileState>({})
  const [submitting, setSubmitting] = useState(false)
  const [sameAddress, setSameAddress] = useState(false)

  useEffect(() => {
    if (!slug) return
    void careersApi.get(slug).then((raw) => setJob(mapPublicCareer(raw))).finally(() => setLoading(false))
  }, [slug])

  usePageSeo(job && slug ? {
    title: `Apply — ${job.title} | SoftKatta Solutions`,
    description: `Apply online for ${job.title} at SoftKatta Solutions.`,
    path: `/careers/${slug}/apply`,
  } : undefined)

  useEffect(() => {
    if (sameAddress) setForm((prev) => ({ ...prev, permanent_address: prev.current_address }))
  }, [sameAddress, form.current_address])

  const update = (patch: Partial<typeof EMPTY>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !files.resume) {
      toast({ title: 'Resume required', description: 'Please upload your resume/CV.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const filePayload = APPLICATION_DOCUMENTS.reduce<Partial<Record<ApplicationDocumentKey, File>>>((acc, { key }) => {
        const file = files[key]
        if (file) acc[key] = file
        return acc
      }, {})

      await careersApi.apply(slug, {
        ...form,
        phone: form.phone.replace(/\D/g, '').slice(0, 10),
        ...filePayload,
        resume: files.resume!,
        recaptcha_token: await getToken('career_apply'),
      })
      toast({
        title: 'Application submitted!',
        description: 'Thank you. A confirmation email has been sent to your inbox.',
        variant: 'success',
      })
      navigate(`/careers/${slug}`)
    } catch (error) {
      toast({ title: 'Submission failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="career-detail-page min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="career-detail-page pt-28 pb-20 text-center">
        <p className="text-muted-foreground mb-4">This opening is no longer available.</p>
        <Link to="/careers" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full">
          <ArrowLeft className="h-4 w-4" /> Back to Careers
        </Link>
      </div>
    )
  }

  return (
    <div className="career-detail-page">
      <div className="career-detail-page__bg" aria-hidden />
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <Link to={`/careers/${slug}`} className="career-detail-page__crumb mb-6 inline-flex">
            <ArrowLeft className="h-4 w-4" /> Back to job details
          </Link>

          <div className="career-apply-dialog__head rounded-t-2xl">
            <div className="career-apply-dialog__head-glow" aria-hidden />
            <div className="career-apply-dialog__head-icon"><Sparkles className="h-5 w-5" /></div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold relative z-10">Apply for {job.title}</h1>
            <p className="text-muted-foreground text-sm mt-2 relative z-10">
              Complete the form below. Fields marked * are required. Upload PDF, JPG, JPEG, or PNG (max 5 MB each).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="career-apply-dialog__body rounded-b-2xl border border-t-0 border-[var(--border)]">
            <section className="space-y-4">
              <h2 className="font-display font-semibold text-lg">Personal details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full name *</Label>
                  <Input required value={form.name} onChange={(e) => update({ name: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile number *</Label>
                  <Input required digitsOnly maxDigits={10} maxLength={10} value={form.phone} onChange={(e) => update({ phone: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Email address *</Label>
                  <Input required type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Date of birth *</Label>
                  <Input required type="date" value={form.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <select required value={form.gender} onChange={(e) => update({ gender: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Current address *</Label>
                  <textarea required rows={3} value={form.current_address} onChange={(e) => update({ current_address: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Permanent address *</Label>
                    <label className="text-xs text-muted-foreground flex items-center gap-2">
                      <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                      Same as current
                    </label>
                  </div>
                  <textarea required rows={3} value={form.permanent_address} onChange={(e) => update({ permanent_address: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2 text-sm" />
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-6">
              <h2 className="font-display font-semibold text-lg">Professional details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Qualification *</Label>
                  <Input required value={form.qualification} onChange={(e) => update({ qualification: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Skills *</Label>
                  <textarea required rows={3} value={form.skills} onChange={(e) => update({ skills: e.target.value })} placeholder="React, Laravel, GST billing…" className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Total experience *</Label>
                  <Input required value={form.total_experience} onChange={(e) => update({ total_experience: e.target.value })} placeholder="3 years" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Current company</Label>
                  <Input value={form.current_company} onChange={(e) => update({ current_company: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Current salary (₹)</Label>
                  <Input digitsOnly allowDecimal maxDigits={12} value={form.current_salary} onChange={(e) => update({ current_salary: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Expected salary (₹)</Label>
                  <Input digitsOnly allowDecimal maxDigits={12} value={form.expected_salary} onChange={(e) => update({ expected_salary: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Notice period</Label>
                  <Input value={form.notice_period} onChange={(e) => update({ notice_period: e.target.value })} placeholder="30 days" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred location</Label>
                  <Input value={form.preferred_location} onChange={(e) => update({ preferred_location: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cover note</Label>
                  <textarea rows={4} value={form.message} onChange={(e) => update({ message: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2 text-sm" />
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-6">
              <h2 className="font-display font-semibold text-lg">Documents — Interview / application stage</h2>
              <p className="text-sm text-muted-foreground">
                Upload PDF, JPG, JPEG, or PNG (max 5 MB each). Experience certificate and salary slips are recommended for experienced candidates.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {APPLICATION_DOCUMENTS.map((doc) => (
                  <div key={doc.key} className="space-y-2">
                    <Label>{doc.label}{doc.required ? ' *' : ''}</Label>
                    {'hint' in doc && doc.hint ? <p className="text-xs text-muted-foreground">{doc.hint}</p> : null}
                    <label htmlFor={`file-${doc.key}`} className="career-apply-dialog__file">
                      <FileUp className="h-4 w-4 text-[var(--brand-blue)] shrink-0" />
                      <span className="min-w-0 truncate text-sm">{files[doc.key]?.name ?? 'Choose file'}</span>
                      <input
                        id={`file-${doc.key}`}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        required={doc.required}
                        onChange={(e) => setFiles((prev) => ({ ...prev, [doc.key]: e.target.files?.[0] ?? null }))}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <div className="career-apply-dialog__footer pt-8">
              <Link to={`/careers/${slug}`} className="career-apply-dialog__cancel">Cancel</Link>
              <button type="submit" disabled={submitting} className="career-apply-dialog__submit">
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
