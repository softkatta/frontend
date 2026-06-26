import { useEffect, useState } from 'react'
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
import type { BlogPost } from '@/types'

export type BlogFormValues = {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  featured_image: string
  is_published: boolean
}

const EMPTY_FORM: BlogFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'General',
  featured_image: '',
  is_published: false,
}

type BlogFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: BlogPost & { is_published?: boolean } | null
  saving?: boolean
  onSubmit: (values: BlogFormValues) => void | Promise<void>
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function BlogFormDialog({ open, onOpenChange, initial, saving, onSubmit }: BlogFormDialogProps) {
  const [form, setForm] = useState<BlogFormValues>(EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setAutoSlug(true)
      return
    }
    if (initial) {
      setForm({
        title: initial.title ?? '',
        slug: initial.slug ?? '',
        excerpt: initial.excerpt ?? '',
        content: initial.content ?? '',
        category: initial.category ?? 'General',
        featured_image: initial.image ?? '',
        is_published: initial.is_published ?? Boolean(initial.published_at),
      })
      setAutoSlug(false)
    } else {
      setForm(EMPTY_FORM)
      setAutoSlug(true)
    }
  }, [open, initial])

  const update = (patch: Partial<BlogFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.title !== undefined) {
        next.slug = slugify(patch.title)
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit post' : 'New post'}</DialogTitle>
          <DialogDescription>Write and publish blog content for the public site.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blog-title">Title</Label>
            <Input id="blog-title" required value={form.title} onChange={(e) => update({ title: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blog-slug">Slug</Label>
            <Input
              id="blog-slug"
              required
              value={form.slug}
              onChange={(e) => { setAutoSlug(false); update({ slug: e.target.value }) }}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blog-category">Category</Label>
            <Input id="blog-category" value={form.category} onChange={(e) => update({ category: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blog-excerpt">Excerpt</Label>
            <textarea
              id="blog-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blog-content">Content</Label>
            <textarea
              id="blog-content"
              required
              rows={8}
              value={form.content}
              onChange={(e) => update({ content: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blog-image">Featured image URL</Label>
            <Input id="blog-image" value={form.featured_image} onChange={(e) => update({ featured_image: e.target.value })} className="h-11 rounded-xl" placeholder="https://..." />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Publish</p>
              <p className="text-xs text-[var(--muted-foreground)]">Make this post visible on the website</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(v) => update({ is_published: v })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update post' : 'Create post'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
