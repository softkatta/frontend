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
import { slugify } from '@/lib/slug'

export type CategoryFormValues = {
  name: string
  slug: string
  description: string
  icon: string
  is_active: boolean
  sort_order: number
}

const EMPTY: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  is_active: true,
  sort_order: 0,
}

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CategoryFormValues | null
  saving?: boolean
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: CategoryFormDialogProps) {
  const [form, setForm] = useState<CategoryFormValues>(EMPTY)
  const [autoSlug, setAutoSlug] = useState(true)
  const isEdit = Boolean(initial?.name)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY)
      setAutoSlug(true)
      return
    }
    setForm(initial ?? EMPTY)
    setAutoSlug(!Boolean(initial?.slug))
  }, [open, initial])

  const update = (patch: Partial<CategoryFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (autoSlug && patch.name !== undefined) {
        next.slug = slugify(patch.name)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit category' : 'Add category'}</DialogTitle>
          <DialogDescription>Organize products into shop categories.</DialogDescription>
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
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Business Software"
              required
              className="bg-[var(--input-background)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false)
                update({ slug: e.target.value })
              }}
              placeholder="business-software"
              className="bg-[var(--input-background)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="package"
                className="bg-[var(--input-background)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                className="bg-[var(--input-background)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cat-active" checked={form.is_active} onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))} />
            <Label htmlFor="cat-active" className="cursor-pointer">Active</Label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
