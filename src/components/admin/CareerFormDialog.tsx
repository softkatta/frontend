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
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { slugify } from '@/lib/slug'
import { adminApi } from '@/services/api'
import { asRecord, unwrapList } from '@/lib/apiHelpers'
import type { CareerOpening } from '@/types'

export type CareerFormValues = {
  title: string
  slug: string
  department: string
  location: string
  employment_type: string
  experience_required: string
  salary_display: string
  excerpt: string
  description: string
  requirements: string
  apply_email: string
  apply_url: string
  sort_order: number
  is_published: boolean
  company_role_id: string
}

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const EMPTY_FORM: CareerFormValues = {
  title: '',
  slug: '',
  department: '',
  location: '',
  employment_type: 'full-time',
  experience_required: '',
  salary_display: '',
  excerpt: '',
  description: '',
  requirements: '',
  apply_email: '',
  apply_url: '',
  sort_order: 0,
  is_published: false,
  company_role_id: '',
}

type CareerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CareerOpening | null
  saving?: boolean
  onSubmit: (values: CareerFormValues) => void | Promise<void>
}

export function CareerFormDialog({ open, onOpenChange, initial, saving, onSubmit }: CareerFormDialogProps) {
  const [form, setForm] = useState<CareerFormValues>(EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)
  const [companyRoles, setCompanyRoles] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) return
    setRolesLoading(true)
    void (async () => {
      try {
        const rows = unwrapList(await adminApi.companyRoles.list({ active_only: true }))
        setCompanyRoles(rows.map((item) => {
          const row = asRecord(item)
          return {
            id: String(row.id ?? ''),
            name: String(row.name ?? ''),
            category: String(row.category ?? 'Other'),
          }
        }))
      } catch {
        setCompanyRoles([])
      } finally {
        setRolesLoading(false)
      }
    })()
  }, [open])

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
        department: initial.department ?? '',
        location: initial.location ?? '',
        employment_type: initial.employment_type ?? 'full-time',
        experience_required: initial.experience_required ?? '',
        salary_display: initial.salary_display ?? '',
        excerpt: initial.excerpt ?? '',
        description: initial.description ?? '',
        requirements: initial.requirements ?? '',
        apply_email: initial.apply_email ?? '',
        apply_url: initial.apply_url ?? '',
        sort_order: initial.sort_order ?? 0,
        is_published: initial.is_published ?? Boolean(initial.published_at),
        company_role_id: initial.company_role_id ?? '',
      })
      setAutoSlug(false)
    } else {
      setForm(EMPTY_FORM)
      setAutoSlug(true)
    }
  }, [open, initial])

  const update = (patch: Partial<CareerFormValues>) => {
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
          <DialogTitle>{isEdit ? 'Edit opening' : 'New opening'}</DialogTitle>
          <DialogDescription>Publish job openings on the public careers page.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="career-title">Job title</Label>
            <Input id="career-title" required value={form.title} onChange={(e) => update({ title: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-slug">Slug</Label>
            <Input
              id="career-slug"
              required
              value={form.slug}
              onChange={(e) => { setAutoSlug(false); update({ slug: e.target.value }) }}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career-department">Department</Label>
              <Input id="career-department" value={form.department} onChange={(e) => update({ department: e.target.value })} className="h-11 rounded-xl" placeholder="Engineering" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-location">Location</Label>
              <Input id="career-location" value={form.location} onChange={(e) => update({ location: e.target.value })} className="h-11 rounded-xl" placeholder="Pune / Remote" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-company-role">Default company role</Label>
            <select
              id="career-company-role"
              value={form.company_role_id}
              onChange={(e) => update({ company_role_id: e.target.value })}
              disabled={rolesLoading}
              className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="">None — select at hire time</option>
              {companyRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name} ({role.category})</option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted-foreground)]">
              Optional. Pre-fills the company role when converting a selected applicant to an employee.
            </p>
            {rolesLoading ? <LoadingSpinner size="sm" /> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career-type">Employment type</Label>
              <select
                id="career-type"
                value={form.employment_type}
                onChange={(e) => update({ employment_type: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-sort">Sort order</Label>
              <Input
                id="career-sort"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => update({ sort_order: Number(e.target.value) || 0 })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career-experience">Experience required</Label>
              <Input id="career-experience" value={form.experience_required} onChange={(e) => update({ experience_required: e.target.value })} placeholder="2–4 years" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-salary">Salary (optional display)</Label>
              <Input id="career-salary" value={form.salary_display} onChange={(e) => update({ salary_display: e.target.value })} placeholder="₹6–10 LPA" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-excerpt">Short summary</Label>
            <textarea
              id="career-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-description">Job description</Label>
            <textarea
              id="career-description"
              required
              rows={6}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-requirements">Requirements</Label>
            <textarea
              id="career-requirements"
              rows={5}
              value={form.requirements}
              onChange={(e) => update({ requirements: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career-email">Apply email</Label>
              <Input id="career-email" type="email" value={form.apply_email} onChange={(e) => update({ apply_email: e.target.value })} className="h-11 rounded-xl" placeholder="careers@softkatta.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-url">Apply URL</Label>
              <Input id="career-url" value={form.apply_url} onChange={(e) => update({ apply_url: e.target.value })} className="h-11 rounded-xl" placeholder="https://..." />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Publish</p>
              <p className="text-xs text-[var(--muted-foreground)]">Make this opening visible on the website</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(v) => update({ is_published: v })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update opening' : 'Create opening'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
