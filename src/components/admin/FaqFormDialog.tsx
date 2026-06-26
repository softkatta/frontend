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
import type { SiteFaq } from '@/types/siteContent'

export type FaqFormValues = {
  category: string
  question: string
  answer: string
  is_active: boolean
}

const EMPTY_FORM: FaqFormValues = {
  category: '',
  question: '',
  answer: '',
  is_active: true,
}

type FaqFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: SiteFaq | null
  saving?: boolean
  onSubmit: (values: FaqFormValues) => void | Promise<void>
}

export function FaqFormDialog({
  open,
  onOpenChange,
  initial,
  saving,
  onSubmit,
}: FaqFormDialogProps) {
  const [form, setForm] = useState<FaqFormValues>(EMPTY_FORM)
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      return
    }
    if (initial) {
      setForm({
        category: initial.category ?? '',
        question: initial.question ?? '',
        answer: initial.answer ?? '',
        is_active: initial.is_active !== false,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, initial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return
    void onSubmit({
      ...form,
      category: form.category.trim(),
      question: form.question.trim(),
      answer: form.answer.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this question on the homepage and product pages.'
              : 'Create a new frequently asked question for the public site.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faq-category">Category (optional)</Label>
            <Input
              id="faq-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Billing, Products, Support…"
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faq-question">Question *</Label>
            <Input
              id="faq-question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="How do I download my GST invoice?"
              required
              className="bg-[var(--input-background)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer *</Label>
            <textarea
              id="faq-answer"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Write a clear answer for customers."
              required
              rows={5}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="faq-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
            <Label htmlFor="faq-active" className="cursor-pointer">
              Show on public site
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.question.trim() || !form.answer.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
