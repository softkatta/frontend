import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PortalPanel } from '@/components/common/PortalPage'
import { adminApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import type { AboutMilestone, AboutValue } from '@/hooks/useAboutContent'

type AboutFormState = {
  highlightTitle: string
  highlightText: string
  storyText: string
  values: AboutValue[]
  milestones: AboutMilestone[]
}

const EMPTY_VALUE: AboutValue = { title: '', description: '' }
const EMPTY_MILESTONE: AboutMilestone = { year: '', title: '', description: '' }

const DEFAULT_FORM: AboutFormState = {
  highlightTitle: "Made for Bharat's SMEs",
  highlightText: 'We understand GST, Udyam, Shop Act, and the realities of running a business in tier-2 and tier-3 cities — because we build for all of India.',
  storyText: 'We help Indian enterprises digitize operations with integrated, affordable, and scalable cloud solutions built for local compliance and global quality.',
  values: [
    { title: 'Mission', description: 'Empower every Indian SME with affordable, world-class cloud software.' },
    { title: 'Vision', description: "India's most trusted SaaS platform for business management." },
    { title: 'Values', description: 'Integrity, innovation, customer-first, continuous improvement.' },
    { title: 'Team', description: 'Engineers, designers, and support specialists building for Indian businesses.' },
  ],
  milestones: [
    { year: '2020', title: 'Founded', description: 'Started building business software' },
    { year: '2022', title: 'Product expansion', description: 'Added POS & CRM modules' },
    { year: '2024', title: 'SaaS platform', description: 'Full multi-product ecosystem' },
    { year: '2025', title: 'Growing', description: 'Serving businesses across India' },
  ],
}

function parseJsonArray<T>(raw: string | undefined, fallback: T[]): T[] {
  if (!raw?.trim()) return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

type AboutContentPanelProps = {
  onSaved: () => void
}

export function AboutContentPanel({ onSaved }: AboutContentPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AboutFormState>(DEFAULT_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const settings = unwrapList<{ key: string; value: string }>(await adminApi.settings.list({ group: 'content' }))
      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

      setForm({
        highlightTitle: map.about_highlight_title || DEFAULT_FORM.highlightTitle,
        highlightText: map.about_highlight_text || DEFAULT_FORM.highlightText,
        storyText: map.about_story_text || DEFAULT_FORM.storyText,
        values: parseJsonArray(map.about_values, DEFAULT_FORM.values),
        milestones: parseJsonArray(map.about_milestones, DEFAULT_FORM.milestones),
      })
    } catch (error) {
      toast({ title: 'Failed to load about content', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const valueRows = useMemo(() => form.values, [form.values])
  const milestoneRows = useMemo(() => form.milestones, [form.milestones])

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.settings.bulkUpdate({
        settings: [
          { key: 'about_highlight_title', value: form.highlightTitle.trim(), group: 'content' },
          { key: 'about_highlight_text', value: form.highlightText.trim(), group: 'content' },
          { key: 'about_story_text', value: form.storyText.trim(), group: 'content' },
          { key: 'about_values', value: JSON.stringify(form.values), group: 'content' },
          { key: 'about_milestones', value: JSON.stringify(form.milestones), group: 'content' },
        ],
      })
      toast({ title: 'About page saved', variant: 'success' })
      onSaved()
      await load()
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateValue = (index: number, patch: Partial<AboutValue>) => {
    setForm((prev) => ({
      ...prev,
      values: prev.values.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const updateMilestone = (index: number, patch: Partial<AboutMilestone>) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <PortalPanel>
      <div className="border-b border-[var(--border)] bg-[var(--input)]/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">About page</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Edit the story, values, and timeline shown on the public About page.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="about-highlight-title">Highlight card title</Label>
            <Input
              id="about-highlight-title"
              value={form.highlightTitle}
              onChange={(e) => setForm({ ...form, highlightTitle: e.target.value })}
              className="bg-[var(--input-background)]"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="about-highlight-text">Highlight card text</Label>
            <textarea
              id="about-highlight-text"
              value={form.highlightText}
              onChange={(e) => setForm({ ...form, highlightText: e.target.value })}
              rows={3}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="about-story-text">Company story paragraph</Label>
            <textarea
              id="about-story-text"
              value={form.storyText}
              onChange={(e) => setForm({ ...form, storyText: e.target.value })}
              rows={4}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-sm font-semibold">Values cards</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setForm((prev) => ({ ...prev, values: [...prev.values, { ...EMPTY_VALUE }] }))}
            >
              <Plus className="h-4 w-4" /> Add card
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {valueRows.map((value, index) => (
              <div key={index} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Card {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => setForm((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== index) }))}
                    aria-label="Remove value card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={value.title}
                  onChange={(e) => updateValue(index, { title: e.target.value })}
                  placeholder="Mission"
                  className="bg-[var(--input-background)]"
                />
                <textarea
                  value={value.description}
                  onChange={(e) => updateValue(index, { description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-sm font-semibold">Timeline milestones</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { ...EMPTY_MILESTONE }] }))}
            >
              <Plus className="h-4 w-4" /> Add milestone
            </Button>
          </div>
          <div className="space-y-3">
            {milestoneRows.map((milestone, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 md:grid-cols-[100px_1fr_1fr_auto]">
                <Input
                  value={milestone.year}
                  onChange={(e) => updateMilestone(index, { year: e.target.value })}
                  placeholder="2025"
                  className="bg-[var(--input-background)]"
                />
                <Input
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, { title: e.target.value })}
                  placeholder="Milestone title"
                  className="bg-[var(--input-background)]"
                />
                <Input
                  value={milestone.description}
                  onChange={(e) => updateMilestone(index, { description: e.target.value })}
                  placeholder="Short description"
                  className="bg-[var(--input-background)]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-red-600"
                  onClick={() => setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }))}
                  aria-label="Remove milestone"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--border)] pt-6">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save About Page'}
          </Button>
        </div>
      </div>
    </PortalPanel>
  )
}
