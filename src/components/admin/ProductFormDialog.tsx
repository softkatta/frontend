import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminApi } from '@/services/api'
import { asRecord, asString, unwrapList } from '@/lib/apiHelpers'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { slugify } from '@/lib/slug'
import type { Product } from '@/types'

export type ProductFormValues = {
  name: string
  slug: string
  description: string
  category_id: string
  features: string[]
  screenshot: string
  demo_video_url: string
  trial_days: number
  is_active: boolean
  has_free_trial: boolean
}

const EMPTY_FORM: ProductFormValues = {
  name: '',
  slug: '',
  description: '',
  category_id: '',
  features: [''],
  screenshot: '',
  demo_video_url: '',
  trial_days: 14,
  is_active: true,
  has_free_trial: true,
}

function parseScreenshot(productRaw: unknown): string {
  const raw = asRecord(productRaw)
  const screenshots = Array.isArray(raw.screenshots) ? raw.screenshots.map(asRecord) : []
  return asString(screenshots[0]?.image_path ?? screenshots[0]?.path)
}

function parseDemoVideo(productRaw: unknown): string {
  const raw = asRecord(productRaw)
  const videos = Array.isArray(raw.videos) ? raw.videos.map(asRecord) : []
  return asString(videos[0]?.video_url)
}

function parseFeatureTitles(productRaw: unknown, initial?: Product | null): string[] {
  const raw = asRecord(productRaw)
  const fromRaw = Array.isArray(raw.features)
    ? raw.features.map((f) => asString(asRecord(f).title ?? f)).filter(Boolean)
    : []
  if (fromRaw.length > 0) return fromRaw
  if (initial?.features?.length) return initial.features
  return ['']
}

type CategoryOption = { id: string; name: string }

type ProductFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Product | null
  productRaw?: unknown
  saving?: boolean
  onSubmit: (values: ProductFormValues) => void | Promise<void>
}

export function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  productRaw,
  saving,
  onSubmit,
}: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) return
    void adminApi.productCategories.list().then((res) => {
      const list = unwrapList(res).map((c) => {
        const row = asRecord(c)
        return { id: asString(row.id), name: asString(row.name, 'Category') }
      })
      setCategories(list)
    })
  }, [open])

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setAutoSlug(true)
      return
    }
    if (initial) {
      const raw = asRecord(productRaw)
      const category = asRecord(raw.category)
      setForm({
        name: initial.name ?? '',
        slug: initial.slug ?? '',
        description: initial.description ?? '',
        category_id: asString(raw.category_id ?? category.id),
        features: parseFeatureTitles(productRaw, initial),
        screenshot: parseScreenshot(productRaw),
        demo_video_url: parseDemoVideo(productRaw),
        trial_days: initial.trial_days ?? 14,
        is_active: initial.is_active !== false,
        has_free_trial: Boolean(raw.has_free_trial ?? true),
      })
      setAutoSlug(false)
    } else {
      setForm(EMPTY_FORM)
      setAutoSlug(true)
    }
  }, [open, initial, productRaw])

  const updateForm = (patch: Partial<ProductFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.name !== undefined) {
        next.slug = slugify(patch.name)
      }
      return next
    })
  }

  const handleScreenshotUpload = async (file: File | null) => {
    if (!file) return
    setUploadingScreenshot(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { path } = await adminApi.uploads.create(formData)
      setForm((f) => ({ ...f, screenshot: path }))
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const screenshotPreview = form.screenshot ? resolveMediaUrl(form.screenshot) : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    void onSubmit({
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update product details. Pricing is managed under Plans.' : 'Create a new software product for the shop.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name *</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="KattaERP"
              required
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-slug">Slug</Label>
            <Input
              id="p-slug"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false)
                updateForm({ slug: e.target.value })
              }}
              placeholder="kattaerp"
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category_id || undefined}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger className="bg-[var(--input-background)]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Product overview for the shop page"
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Features</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setForm((f) => ({ ...f, features: [...f.features, ''] }))}
              >
                <Plus className="h-3.5 w-3.5" /> Add feature
              </Button>
            </div>
            <div className="space-y-2">
              {form.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const next = [...form.features]
                      next[index] = e.target.value
                      setForm({ ...form, features: next })
                    }}
                    placeholder="GST Invoicing"
                    className="bg-[var(--input-background)]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-red-600"
                    disabled={form.features.length === 1}
                    onClick={() => setForm((f) => ({
                      ...f,
                      features: f.features.filter((_, i) => i !== index),
                    }))}
                    aria-label="Remove feature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Shown on the product detail page with checkmarks.</p>
          </div>

          <div className="space-y-2">
            <Label>Product screenshot</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploadingScreenshot}
              onChange={(e) => void handleScreenshotUpload(e.target.files?.[0] ?? null)}
              className="bg-[var(--input-background)]"
            />
            <Input
              value={form.screenshot}
              onChange={(e) => setForm({ ...form, screenshot: e.target.value })}
              placeholder="/screenshots/kattaerp.svg or uploaded path"
              className="bg-[var(--input-background)]"
            />
            {screenshotPreview ? (
              <img src={screenshotPreview} alt="Screenshot preview" className="mt-2 w-full rounded-lg border border-[var(--border)] aspect-video object-cover object-top" />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-demo-video">Demo video URL</Label>
            <Input
              id="p-demo-video"
              value={form.demo_video_url}
              onChange={(e) => setForm({ ...form, demo_video_url: e.target.value })}
              placeholder="https://www.youtube.com/embed/... or watch link"
              className="bg-[var(--input-background)]"
            />
            <p className="text-xs text-muted-foreground">YouTube embed or watch URL. Shown on the product page.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-trial-days">Trial days</Label>
            <Input
              id="p-trial-days"
              type="number"
              min={0}
              value={form.trial_days}
              disabled={!form.has_free_trial}
              onChange={(e) => setForm({ ...form, trial_days: Number(e.target.value) || 0 })}
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="p-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="p-active" className="cursor-pointer">Active in shop</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="p-free-trial"
                checked={form.has_free_trial}
                onCheckedChange={(checked) => setForm({ ...form, has_free_trial: checked })}
              />
              <Label htmlFor="p-free-trial" className="cursor-pointer">Free trial on website</Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
