import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PortalPanel } from '@/components/common/PortalPage'
import { adminApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import type { PublicPageContent, PublicPageSeoEntry, WhyCard } from '@/types/pageContent'

const PAGE_OPTIONS = [
  { id: 'home', label: 'Homepage' },
  { id: 'services', label: 'Services page' },
  { id: 'products', label: 'Products page' },
  { id: 'contact', label: 'Contact page' },
  { id: 'careers', label: 'Careers page' },
  { id: 'blog', label: 'Blog page' },
  { id: 'faq', label: 'FAQ page' },
  { id: 'pricing', label: 'Pricing page' },
] as const

const SEO_PATHS = ['/', '/services', '/products', '/about', '/contact', '/careers', '/blog', '/faq', '/pricing'] as const

type PageContentPanelProps = {
  onSaved: () => void
}

function linesToList(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function listToLines(value?: string[]): string {
  return (value ?? []).join('\n')
}

export function PageContentPanel({ onSaved }: PageContentPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activePage, setActivePage] = useState<(typeof PAGE_OPTIONS)[number]['id']>('home')
  const [pages, setPages] = useState<Record<string, PublicPageContent>>({})
  const [seo, setSeo] = useState<Record<string, PublicPageSeoEntry>>({})
  const [listFields, setListFields] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const settings = unwrapList<{ key: string; value: string }>(await adminApi.settings.list({ group: 'content' }))
      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
      const nextPages: Record<string, PublicPageContent> = {}
      for (const option of PAGE_OPTIONS) {
        const raw = map[`page_content_${option.id}`]
        nextPages[option.id] = raw ? (JSON.parse(raw) as PublicPageContent) : {}
      }
      setPages(nextPages)
      setSeo(map.public_page_seo ? (JSON.parse(map.public_page_seo) as Record<string, PublicPageSeoEntry>) : {})
      setListFields({
        trust_items: listToLines(nextPages.home?.trust_items),
        hero_badges: listToLines(nextPages.home?.hero_badges),
        typewriter_phrases: listToLines(nextPages.home?.typewriter_phrases),
        why_choose_items: listToLines(nextPages.services?.why_choose_items),
        categories: listToLines(nextPages.blog?.categories),
      })
    } catch (error) {
      toast({ title: 'Failed to load page content', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const page = pages[activePage] ?? {}

  const updatePage = (patch: Partial<PublicPageContent>) => {
    setPages((prev) => ({ ...prev, [activePage]: { ...prev[activePage], ...patch } }))
  }

  const updateSection = (key: string, patch: Partial<PublicPageContent>) => {
    setPages((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        sections: {
          ...(prev.home?.sections ?? {}),
          [key]: { ...(prev.home?.sections?.[key] ?? {}), ...patch },
        },
      },
    }))
  }

  const perks = page.perks ?? []
  const whyCards = pages.home?.why_cards ?? []
  const whyHighlight = pages.home?.why_highlight ?? {}

  const updateWhyHighlight = (patch: Partial<NonNullable<PublicPageContent['why_highlight']>>) => {
    setPages((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        why_highlight: { ...(prev.home?.why_highlight ?? {}), ...patch },
      },
    }))
  }

  const updateWhyCard = (index: number, patch: Partial<WhyCard>) => {
    setPages((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        why_cards: (prev.home?.why_cards ?? []).map((card, i) => (i === index ? { ...card, ...patch } : card)),
      },
    }))
  }

  const addWhyCard = () => {
    setPages((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        why_cards: [...(prev.home?.why_cards ?? []), { icon: 'zap', title: '', description: '', color: '#2563eb' }],
      },
    }))
  }

  const removeWhyCard = (index: number) => {
    setPages((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        why_cards: (prev.home?.why_cards ?? []).filter((_, i) => i !== index),
      },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const mergedPages = { ...pages }
      mergedPages.home = {
        ...mergedPages.home,
        trust_items: linesToList(listFields.trust_items ?? ''),
        hero_badges: linesToList(listFields.hero_badges ?? ''),
        typewriter_phrases: linesToList(listFields.typewriter_phrases ?? ''),
      }
      mergedPages.services = {
        ...mergedPages.services,
        why_choose_items: linesToList(listFields.why_choose_items ?? ''),
      }
      mergedPages.blog = {
        ...mergedPages.blog,
        categories: linesToList(listFields.categories ?? ''),
      }

      const settings = [
        ...PAGE_OPTIONS.map((option) => ({
          key: `page_content_${option.id}`,
          value: JSON.stringify(mergedPages[option.id] ?? {}),
          group: 'content' as const,
        })),
        { key: 'public_page_seo', value: JSON.stringify(seo), group: 'content' as const },
      ]

      await adminApi.settings.bulkUpdate({ settings })
      toast({ title: 'Page content saved', variant: 'success' })
      onSaved()
      await load()
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const sectionKeys = useMemo(() => ['products', 'services', 'why', 'faq'] as const, [])

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Public page copy</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Edit hero text and SEO for public website pages.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <div className="flex flex-wrap gap-2">
          {PAGE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={activePage === option.id ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActivePage(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>{activePage === 'home' ? 'Hero eyebrow' : 'Label'}</Label>
            <Input value={page.label ?? ''} onChange={(e) => updatePage({ label: e.target.value })} className="bg-[var(--input-background)]" />
          </div>
          <div className="space-y-2">
            <Label>{activePage === 'home' ? 'Hero title (line 1)' : 'Title'}</Label>
            <Input value={page.title ?? ''} onChange={(e) => updatePage({ title: e.target.value })} className="bg-[var(--input-background)]" />
          </div>
          <div className="space-y-2">
            <Label>{activePage === 'home' ? 'Highlight (fallback)' : 'Highlight'}</Label>
            <Input value={page.highlight ?? ''} onChange={(e) => updatePage({ highlight: e.target.value })} className="bg-[var(--input-background)]" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>{activePage === 'home' ? 'Hero description' : 'Description'}</Label>
            <textarea
              rows={3}
              value={page.description ?? ''}
              onChange={(e) => updatePage({ description: e.target.value })}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        {activePage === 'home' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Hero badges under buttons (one per line)</Label>
              <textarea
                rows={4}
                value={listFields.hero_badges ?? ''}
                onChange={(e) => setListFields((prev) => ({ ...prev, hero_badges: e.target.value }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Marquee trust badges (one per line)</Label>
              <textarea
                rows={4}
                value={listFields.trust_items ?? ''}
                onChange={(e) => setListFields((prev) => ({ ...prev, trust_items: e.target.value }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Typewriter phrases (one per line)</Label>
              <textarea
                rows={4}
                value={listFields.typewriter_phrases ?? ''}
                onChange={(e) => setListFields((prev) => ({ ...prev, typewriter_phrases: e.target.value }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            {sectionKeys.map((sectionKey) => {
              const section = pages.home?.sections?.[sectionKey] ?? {}
              return (
                <div key={sectionKey} className="lg:col-span-2 rounded-xl border border-[var(--border)] p-4 space-y-3">
                  <h4 className="font-semibold capitalize">Home section: {sectionKey}</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Label" value={section.label ?? ''} onChange={(e) => updateSection(sectionKey, { label: e.target.value })} className="bg-[var(--input-background)]" />
                    <Input placeholder="Title" value={section.title ?? ''} onChange={(e) => updateSection(sectionKey, { title: e.target.value })} className="bg-[var(--input-background)]" />
                    <Input placeholder="Highlight" value={section.highlight ?? ''} onChange={(e) => updateSection(sectionKey, { highlight: e.target.value })} className="bg-[var(--input-background)]" />
                    <Input placeholder="Description" value={section.description ?? ''} onChange={(e) => updateSection(sectionKey, { description: e.target.value })} className="bg-[var(--input-background)]" />
                  </div>
                </div>
              )
            })}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border)] p-4 space-y-4">
              <h4 className="font-semibold">Why section — highlight card</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Stat (e.g. India)" value={whyHighlight.stat ?? ''} onChange={(e) => updateWhyHighlight({ stat: e.target.value })} className="bg-[var(--input-background)]" />
                <Input placeholder="Title" value={whyHighlight.title ?? ''} onChange={(e) => updateWhyHighlight({ title: e.target.value })} className="bg-[var(--input-background)]" />
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={whyHighlight.description ?? ''}
                  onChange={(e) => updateWhyHighlight({ description: e.target.value })}
                  className="sm:col-span-2 flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-[var(--border)] p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold">Why section — feature cards</h4>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addWhyCard}>
                  <Plus className="h-4 w-4" /> Add card
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Icon keys: zap, shield, barchart, users</p>
              <div className="grid gap-4 md:grid-cols-2">
                {whyCards.map((card, index) => (
                  <div key={index} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Card {index + 1}</Label>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeWhyCard(index)} aria-label="Remove card">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input placeholder="Icon (zap, shield, barchart, users)" value={card.icon ?? ''} onChange={(e) => updateWhyCard(index, { icon: e.target.value })} className="bg-[var(--input-background)]" />
                    <Input placeholder="Title" value={card.title} onChange={(e) => updateWhyCard(index, { title: e.target.value })} className="bg-[var(--input-background)]" />
                    <textarea placeholder="Description" rows={3} value={card.description} onChange={(e) => updateWhyCard(index, { description: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
                    <Input placeholder="Accent color (#2563eb)" value={card.color ?? ''} onChange={(e) => updateWhyCard(index, { color: e.target.value })} className="bg-[var(--input-background)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePage === 'services' && (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Why choose title</Label>
              <Input value={page.why_choose_title ?? ''} onChange={(e) => updatePage({ why_choose_title: e.target.value })} className="bg-[var(--input-background)]" />
            </div>
            <div className="space-y-2">
              <Label>Why choose items (one per line)</Label>
              <textarea
                rows={6}
                value={listFields.why_choose_items ?? ''}
                onChange={(e) => setListFields((prev) => ({ ...prev, why_choose_items: e.target.value }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>CTA text</Label>
              <textarea rows={2} value={page.cta_text ?? ''} onChange={(e) => updatePage({ cta_text: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
            <p className="text-sm text-muted-foreground">Service cards and detail content are edited under Admin → Services.</p>
          </div>
        )}

        {activePage === 'blog' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label>Categories (one per line)</Label>
              <textarea rows={6} value={listFields.categories ?? ''} onChange={(e) => setListFields((prev) => ({ ...prev, categories: e.target.value }))} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <Label>CTA title</Label>
              <Input value={page.cta_title ?? ''} onChange={(e) => updatePage({ cta_title: e.target.value })} className="bg-[var(--input-background)]" />
            </div>
            <div className="space-y-2">
              <Label>CTA description</Label>
              <textarea rows={3} value={page.cta_description ?? ''} onChange={(e) => updatePage({ cta_description: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {(activePage === 'contact' || activePage === 'pricing') && (
          <div className="grid gap-4 lg:grid-cols-2">
            {activePage === 'contact' && (
              <>
                <div className="space-y-2">
                  <Label>CTA title</Label>
                  <Input value={page.cta_title ?? ''} onChange={(e) => updatePage({ cta_title: e.target.value })} className="bg-[var(--input-background)]" />
                </div>
                <div className="space-y-2">
                  <Label>CTA description</Label>
                  <textarea rows={3} value={page.cta_description ?? ''} onChange={(e) => updatePage({ cta_description: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
                </div>
              </>
            )}
            <div className="space-y-2 lg:col-span-2">
              <Label>Trust items (one per line)</Label>
              <textarea rows={4} value={listToLines(page.trust_items)} onChange={(e) => updatePage({ trust_items: linesToList(e.target.value) })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {activePage === 'careers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Perks</h4>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => updatePage({ perks: [...perks, { title: '', text: '' }] })}>
                <Plus className="h-4 w-4" /> Add perk
              </Button>
            </div>
            {perks.map((perk, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-[1fr_1fr_auto]">
                <Input placeholder="Title" value={perk.title} onChange={(e) => updatePage({ perks: perks.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)) })} className="bg-[var(--input-background)]" />
                <Input placeholder="Description" value={perk.text} onChange={(e) => updatePage({ perks: perks.map((item, i) => (i === index ? { ...item, text: e.target.value } : item)) })} className="bg-[var(--input-background)]" />
                <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => updatePage({ perks: perks.filter((_, i) => i !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <h4 className="font-display font-semibold">Page SEO</h4>
          {SEO_PATHS.map((path) => (
            <div key={path} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <p className="text-sm font-semibold">{path}</p>
              <Input
                placeholder="Meta title"
                value={seo[path]?.title ?? ''}
                onChange={(e) => setSeo((prev) => ({ ...prev, [path]: { ...prev[path], title: e.target.value } }))}
                className="bg-[var(--input-background)]"
              />
              <textarea
                placeholder="Meta description"
                rows={2}
                value={seo[path]?.description ?? ''}
                onChange={(e) => setSeo((prev) => ({ ...prev, [path]: { ...prev[path], description: e.target.value } }))}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void save()} disabled={saving} className="glow-btn rounded-full px-8">
            {saving ? 'Saving…' : 'Save page content'}
          </Button>
        </div>
      </div>
    </PortalPanel>
  )
}
