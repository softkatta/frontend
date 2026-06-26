import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
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
import type { SiteTestimonial } from '@/types/siteContent'

export type TestimonialFormValues = {
  name: string
  designation: string
  company: string
  content: string
  rating: number
  is_active: boolean
}

const EMPTY_FORM: TestimonialFormValues = {
  name: '',
  designation: '',
  company: '',
  content: '',
  rating: 5,
  is_active: true,
}

type TestimonialFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: SiteTestimonial | null
  saving?: boolean
  onSubmit: (values: TestimonialFormValues, avatarFile?: File) => void | Promise<void>
}

export function TestimonialFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: TestimonialFormDialogProps) {
  const [form, setForm] = useState<TestimonialFormValues>(EMPTY_FORM)
  const [avatarFile, setAvatarFile] = useState<File | undefined>()
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setAvatarFile(undefined)
      return
    }
    if (initial) {
      setForm({
        name: initial.name ?? '',
        designation: initial.designation ?? initial.role ?? '',
        company: initial.company ?? '',
        content: initial.content ?? '',
        rating: initial.rating ?? 5,
        is_active: initial.is_active !== false,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setAvatarFile(undefined)
  }, [open, initial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) return
    void onSubmit(
      {
        ...form,
        name: form.name.trim(),
        designation: form.designation.trim(),
        company: form.company.trim(),
        content: form.content.trim(),
      },
      avatarFile,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit testimonial' : 'Add testimonial'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update customer details shown on the homepage carousel.'
              : 'Create a new testimonial for the homepage carousel.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-name">Name *</Label>
            <Input
              id="t-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rajesh Kumar"
              required
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-designation">Designation</Label>
              <Input
                id="t-designation"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="CEO"
                className="bg-[var(--input-background)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-company">Company</Label>
              <Input
                id="t-company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="TechMart India"
                className="bg-[var(--input-background)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-content">Testimonial *</Label>
            <textarea
              id="t-content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="What did the customer say about SoftKatta?"
              required
              rows={4}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select
                value={String(form.rating)}
                onValueChange={(v) => setForm({ ...form, rating: Number(v) })}
              >
                <SelectTrigger className="bg-[var(--input-background)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} star{n !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch
                id="t-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="t-active" className="cursor-pointer">
                Show on homepage
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/30 px-4 py-3 transition-colors hover:border-[var(--brand-blue)]/40">
              <ImagePlus className="h-5 w-5 text-[var(--brand-blue)]" />
              <span className="text-sm text-[var(--muted-foreground)]">
                {avatarFile ? avatarFile.name : 'Upload avatar image'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  setAvatarFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim() || !form.content.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add testimonial'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
