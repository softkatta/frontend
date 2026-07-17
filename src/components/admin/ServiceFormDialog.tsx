import { useEffect, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
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
import { adminApi } from '@/services/api'
import { slugify } from '@/lib/slug'
import { resolveMediaUrl } from '@/lib/mediaUrl'

export type ServiceFormValues = {
  name: string
  slug: string
  description: string
  body: string
  bullets_heading: string
  bullets: string
  meta_title: string
  meta_description: string
  icon: string
  image: string
  is_active: boolean
  sort_order: number
}

const EMPTY: ServiceFormValues = {
  name: '',
  slug: '',
  description: '',
  body: '',
  bullets_heading: '',
  bullets: '',
  meta_title: '',
  meta_description: '',
  icon: '',
  image: '',
  is_active: true,
  sort_order: 0,
}

type ServiceFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ServiceFormValues | null
  saving?: boolean
  onSubmit: (values: ServiceFormValues) => void | Promise<void>
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: ServiceFormDialogProps) {
  const [form, setForm] = useState<ServiceFormValues>(EMPTY)
  const [autoSlug, setAutoSlug] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const isEdit = Boolean(initial?.name)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      setAutoSlug(true)
      setImagePreview('')
      return
    }
    setForm(initial ?? EMPTY)
    setAutoSlug(!Boolean(initial?.slug))
    setImagePreview(initial?.image ? resolveMediaUrl(initial.image) : '')
  }, [open, initial])

  const update = (patch: Partial<ServiceFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.name !== undefined) {
        next.slug = slugify(patch.name)
      }
      return next
    })
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'services')
      const { path, url } = await adminApi.uploads.create(formData)
      setForm((f) => ({ ...f, image: path }))
      setImagePreview(resolveMediaUrl(url ?? path))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit service' : 'Add service'}</DialogTitle>
          <DialogDescription>
            Services appear on the public Services page and homepage.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.name.trim()) return
            void onSubmit({ ...form, name: form.name.trim() })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="service-name">Name *</Label>
            <Input
              id="service-name"
              required
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-slug">Slug</Label>
            <Input
              id="service-slug"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false)
                update({ slug: e.target.value })
              }}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-desc">Short description</Label>
            <textarea
              id="service-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-body">Detail page body</Label>
            <textarea
              id="service-body"
              rows={6}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Full content shown on the service detail page"
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-bullets-heading">Bullets heading</Label>
            <Input
              id="service-bullets-heading"
              value={form.bullets_heading}
              onChange={(e) => setForm((f) => ({ ...f, bullets_heading: e.target.value }))}
              placeholder="What we deliver"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-bullets">Bullet points (one per line)</Label>
            <textarea
              id="service-bullets"
              rows={5}
              value={form.bullets}
              onChange={(e) => setForm((f) => ({ ...f, bullets: e.target.value }))}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-meta-title">SEO title</Label>
              <Input
                id="service-meta-title"
                value={form.meta_title}
                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-meta-desc">SEO description</Label>
              <textarea
                id="service-meta-desc"
                rows={2}
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-icon">Icon</Label>
              <Input
                id="service-icon"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="Code, Cloud, Rocket…"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-sort">Sort order</Label>
              <Input
                id="service-sort"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover image</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative h-28 w-full sm:w-40 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--input)]/40">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-2 text-center">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                  className="h-11 rounded-xl"
                />
                <Input
                  value={form.image}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, image: e.target.value }))
                    setImagePreview(e.target.value ? resolveMediaUrl(e.target.value) : '')
                  }}
                  placeholder="Or paste storage path / URL"
                  className="h-11 rounded-xl"
                />
                {uploading && (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="service-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
            />
            <Label htmlFor="service-active" className="cursor-pointer">Active on website</Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading || !form.name.trim()} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
