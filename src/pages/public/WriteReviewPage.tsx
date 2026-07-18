import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Send, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/reviews/StarRating'
import { productsApi, servicesApi, type ServiceItem } from '@/services/api'
import { reviewsApi } from '@/services/api/modules/reviews.api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import { toast } from '@/components/ui/toaster'
import type { Product } from '@/types'
import type { ReviewType } from '@/types/reviews'

const EMPTY = {
  full_name: '',
  company_name: '',
  email: '',
  mobile: '',
  city: '',
  country: 'India',
  title: '',
  description: '',
}

export default function WriteReviewPage() {
  const [searchParams] = useSearchParams()
  const initialType = (searchParams.get('type') === 'service' ? 'service' : 'product') as ReviewType
  const prefillSlug = searchParams.get('slug') || ''
  const { getToken } = useRecaptcha('submit_review')

  const [reviewType, setReviewType] = useState<ReviewType>(initialType)
  const [productId, setProductId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [form, setForm] = useState(EMPTY)
  const [rating, setRating] = useState(5)
  const [recommend, setRecommend] = useState(true)
  const [consent, setConsent] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  usePageSeo({
    title: 'Write a Review — SoftKatta Solutions',
    description: 'Share your experience with SoftKatta products or services. Your feedback helps businesses across India choose the right software partner.',
    path: '/reviews/write',
  })

  useEffect(() => {
    void Promise.all([
      productsApi.list().then(setProducts).catch(() => setProducts([])),
      servicesApi.list().then(setServices).catch(() => setServices([])),
    ])
  }, [])

  useEffect(() => {
    if (!prefillSlug) return
    if (reviewType === 'product') {
      const match = products.find((p) => p.slug === prefillSlug)
      if (match) setProductId(String(match.id))
    } else {
      const match = services.find((s) => s.slug === prefillSlug)
      if (match) setServiceId(String(match.id))
    }
  }, [prefillSlug, products, services, reviewType])

  const targetOptions = useMemo(
    () => (reviewType === 'product' ? products : services),
    [reviewType, products, services],
  )

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!consent) {
      toast({ title: 'Consent required', description: 'Please accept the consent checkbox to continue.', variant: 'destructive' })
      return
    }
    if (rating < 1) {
      toast({ title: 'Rating required', description: 'Please select a star rating.', variant: 'destructive' })
      return
    }
    const mobile = form.mobile.replace(/\D/g, '')
    if (mobile.length !== 10) {
      toast({ title: 'Invalid mobile', description: 'Enter a valid 10-digit mobile number.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken('submit_review')
      await reviewsApi.submit({
        review_type: reviewType,
        product_id: reviewType === 'product' ? productId : undefined,
        service_id: reviewType === 'service' ? serviceId : undefined,
        ...form,
        mobile,
        rating,
        would_recommend: recommend,
        consent: true,
        profile_image: profileImage,
        screenshot,
        recaptcha_token: token,
      })
      setSubmitted(true)
      toast({ title: 'Review submitted', description: 'Thank you! Your review is pending approval.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not submit review', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--brand-teal)]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Thank you!</h1>
        <p className="mt-3 text-muted-foreground">
          Your review was submitted and is pending approval. It will appear on the site once our team verifies it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to={reviewType === 'product' ? '/products' : '/services'}>Browse {reviewType}s</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-6">
        <p className="section-label">Reviews</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Write a review
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Share your experience with a SoftKatta product or service. Reviews help other businesses make confident decisions.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Review type</Label>
            <div className="flex flex-wrap gap-2">
              {(['product', 'service'] as ReviewType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReviewType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    reviewType === type
                      ? 'bg-[var(--brand-blue)] text-white'
                      : 'bg-[var(--input)] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type === 'product' ? 'Product' : 'Service'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="target">{reviewType === 'product' ? 'Select product' : 'Select service'}</Label>
            <select
              id="target"
              required
              className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
              value={reviewType === 'product' ? productId : serviceId}
              onChange={(e) => {
                if (reviewType === 'product') setProductId(e.target.value)
                else setServiceId(e.target.value)
              }}
            >
              <option value="">Choose…</option>
              {targetOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company name (optional)</Label>
            <Input id="company_name" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" required digitsOnly maxDigits={10} maxLength={10} value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="h-10 rounded-xl" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Review title</Label>
            <Input id="title" required maxLength={160} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Review description</Label>
            <textarea
              id="description"
              required
              minLength={20}
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              placeholder="Tell us what worked well, what could improve, and who this is best for…"
            />
          </div>

          <div className="space-y-2">
            <Label>Profile image (optional)</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 py-3 text-sm text-muted-foreground hover:bg-[var(--input)]/40">
              <Upload className="h-4 w-4" />
              <span className="truncate">{profileImage?.name || 'Upload image'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="space-y-2">
            <Label>Project screenshot (optional)</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 py-3 text-sm text-muted-foreground hover:bg-[var(--input)]/40">
              <Upload className="h-4 w-4" />
              <span className="truncate">{screenshot?.name || 'Upload screenshot'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <Label>Would you recommend SoftKatta?</Label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setRecommend(val)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    recommend === val
                      ? 'bg-[var(--brand-teal)] text-white'
                      : 'bg-[var(--input)] text-muted-foreground'
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 sm:col-span-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
              required
            />
            <span>
              I consent to SoftKatta Solutions publishing my review (name, company, city, and content) on the website and marketing materials.
            </span>
          </label>
        </div>

        <Button type="submit" disabled={submitting} className="rounded-full px-6">
          <Send className="mr-2 h-4 w-4" />
          {submitting ? 'Submitting…' : 'Submit review'}
        </Button>
      </form>
    </div>
  )
}
