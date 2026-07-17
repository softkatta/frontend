import { useEffect, useState } from 'react'
import { FileUp, Send, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { careersApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

type CareerApplyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  jobSlug: string
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

export function CareerApplyDialog({ open, onOpenChange, jobTitle, jobSlug }: CareerApplyDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setResumeFile(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phone = form.phone.replace(/\D/g, '')
    if (phone && phone.length !== 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Enter a 10-digit mobile number or leave phone blank.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await careersApi.apply(jobSlug, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phone || undefined,
        message: form.message.trim(),
        resume: resumeFile ?? undefined,
      })
      toast({
        title: 'Application submitted!',
        description: 'Thank you. Our team will review your application and get back to you.',
        variant: 'success',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Could not submit application',
        description: getApiErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="career-apply-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg p-0 gap-0 border-0">
        <div className="career-apply-dialog__head">
          <div className="career-apply-dialog__head-glow" aria-hidden />
          <div className="career-apply-dialog__head-icon">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogHeader className="relative z-10 space-y-1.5 pr-8">
            <DialogTitle className="font-display text-xl">Apply for {jobTitle}</DialogTitle>
            <DialogDescription>
              Submit your details below. You can attach a resume (PDF, DOC, or DOCX).
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="career-apply-dialog__body">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="apply-name">Full name</Label>
              <Input
                id="apply-name"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 rounded-xl bg-[var(--background)]/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-email">Email</Label>
              <Input
                id="apply-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="h-11 rounded-xl bg-[var(--background)]/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-phone">Phone (optional)</Label>
              <Input
                id="apply-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                className="h-11 rounded-xl bg-[var(--background)]/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apply-message">Cover note</Label>
            <textarea
              id="apply-message"
              required
              minLength={20}
              rows={5}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us why you are a good fit for this role…"
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] min-h-[7.5rem]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apply-resume">Resume (optional)</Label>
            <label htmlFor="apply-resume" className="career-apply-dialog__file">
              <FileUp className="h-4 w-4 text-[var(--brand-blue)] shrink-0" />
              <span className="min-w-0 truncate text-sm">
                {resumeFile ? resumeFile.name : 'Choose PDF, DOC, or DOCX'}
              </span>
              <input
                id="apply-resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Secure submission', 'HR review in 3–5 days'].map((t) => (
              <span key={t} className="career-apply-dialog__pill">{t}</span>
            ))}
          </div>

          <DialogFooter className="career-apply-dialog__footer">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="career-apply-dialog__cancel"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="career-apply-dialog__submit">
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
