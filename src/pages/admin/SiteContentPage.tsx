import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Monitor, Pencil, Plus, Trash2, Upload, Users, HelpCircle, BookOpen, Megaphone, FileText } from 'lucide-react'
import { HeroSlideCropDialog } from '@/components/admin/HeroSlideCropDialog'
import { TestimonialFormDialog, type TestimonialFormValues } from '@/components/admin/TestimonialFormDialog'
import { AboutContentPanel } from '@/components/admin/AboutContentPanel'
import { PageContentPanel } from '@/components/admin/PageContentPanel'
import { FaqsContentPanel } from '@/components/admin/FaqsContentPanel'
import { OffersContentPanel } from '@/components/admin/OffersContentPanel'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminUi'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toaster'
import { adminApi } from '@/services/api'
import { unwrapList, getApiErrorMessage } from '@/lib/apiHelpers'
import { clearSiteContentCache } from '@/hooks/useSiteContent'
import { notifySiteConfigUpdated } from '@/lib/siteConfigEvents'
import { HERO_MONITOR_LABEL } from '@/lib/heroMonitor'
import { resolveMediaUrl, testimonialAvatar } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'
import type { HeroSlide, SiteTestimonial } from '@/types/siteContent'

function PanelHeading({ icon: Icon, title, description }: { icon: typeof Monitor; title: string; description?: string }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--input)]/40 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-[var(--muted-foreground)]">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function SiteContentPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [testimonials, setTestimonials] = useState<SiteTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newSlide, setNewSlide] = useState({ title: '', alt_text: '' })
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFileName, setCropFileName] = useState('')
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<SiteTestimonial | null>(null)
  const [savingTestimonial, setSavingTestimonial] = useState(false)
  const [deleteTestimonialId, setDeleteTestimonialId] = useState<number | string | null>(null)
  const [deletingTestimonial, setDeletingTestimonial] = useState(false)

  const invalidatePublicContent = () => {
    clearSiteContentCache()
    notifySiteConfigUpdated('content')
  }

  const closeCrop = useCallback(() => {
    setCropOpen(false)
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setCropFileName('')
  }, [])

  const openCropForFile = (file: File) => {
    if (file.type === 'image/svg+xml') {
      void uploadSlideImage(file)
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setCropFileName(file.name)
    setCropOpen(true)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [slidesRes, testimonialsRes] = await Promise.all([
        adminApi.heroSlides.list(),
        adminApi.testimonials.list(),
      ])
      setSlides(unwrapList<HeroSlide>(slidesRes))
      setTestimonials(unwrapList<SiteTestimonial>(testimonialsRes))
    } catch {
      toast({ title: 'Failed to load site content', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const uploadSlideImage = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'hero-slides')
      const { path } = await adminApi.uploads.create(form)
      const titleFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
      await adminApi.heroSlides.create({
        title: newSlide.title.trim() || titleFromFile || 'Hero slide',
        alt_text: newSlide.alt_text || newSlide.title || titleFromFile || 'SoftKatta dashboard',
        image: path,
        sort_order: slideRows.length,
        is_active: true,
      })
      toast({ title: 'Hero slide added', variant: 'success' })
      setNewSlide({ title: '', alt_text: '' })
      closeCrop()
      invalidatePublicContent()
      await load()
    } catch (error) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const toggleSlide = async (slide: HeroSlide) => {
    try {
      await adminApi.heroSlides.update(slide.id, { is_active: !slide.is_active })
      invalidatePublicContent()
      await load()
    } catch (error) {
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const deleteSlide = async (id: number | string) => {
    try {
      await adminApi.heroSlides.delete(id)
      toast({ title: 'Slide removed', variant: 'success' })
      invalidatePublicContent()
      await load()
    } catch (error) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const uploadAvatar = async (testimonialId: number | string, file: File) => {
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'testimonials')
      const { path } = await adminApi.uploads.create(form)
      await adminApi.testimonials.update(testimonialId, { avatar: path })
      toast({ title: 'Avatar updated', variant: 'success' })
      await load()
      invalidatePublicContent()
    } catch (error) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const uploadTestimonialAvatar = async (testimonialId: number | string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'testimonials')
    const { path } = await adminApi.uploads.create(form)
    await adminApi.testimonials.update(testimonialId, { avatar: path })
  }

  const openAddTestimonial = () => {
    setEditingTestimonial(null)
    setTestimonialDialogOpen(true)
  }

  const openEditTestimonial = (t: SiteTestimonial) => {
    setEditingTestimonial(t)
    setTestimonialDialogOpen(true)
  }

  const saveTestimonial = async (values: TestimonialFormValues, avatarFile?: File) => {
    setSavingTestimonial(true)
    try {
      if (editingTestimonial) {
        await adminApi.testimonials.update(editingTestimonial.id, values)
        if (avatarFile) await uploadTestimonialAvatar(editingTestimonial.id, avatarFile)
        toast({ title: 'Testimonial updated', variant: 'success' })
      } else {
        const created = await adminApi.testimonials.create({
          ...values,
          sort_order: testimonialRows.length,
        })
        if (avatarFile && created?.id != null) {
          await uploadTestimonialAvatar(created.id, avatarFile)
        }
        toast({ title: 'Testimonial added', variant: 'success' })
      }
      setTestimonialDialogOpen(false)
      setEditingTestimonial(null)
      await load()
      invalidatePublicContent()
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSavingTestimonial(false)
    }
  }

  const confirmDeleteTestimonial = async () => {
    if (deleteTestimonialId == null) return
    setDeletingTestimonial(true)
    try {
      await adminApi.testimonials.delete(deleteTestimonialId)
      toast({ title: 'Testimonial deleted', variant: 'success' })
      setDeleteTestimonialId(null)
      await load()
      invalidatePublicContent()
    } catch (error) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setDeletingTestimonial(false)
    }
  }

  const toggleTestimonial = async (t: SiteTestimonial) => {
    const active = t.is_active !== false
    try {
      await adminApi.testimonials.update(t.id, { is_active: !active })
      await load()
      invalidatePublicContent()
    } catch (error) {
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const testimonialRows = useMemo(
    () => (Array.isArray(testimonials) ? testimonials : unwrapList<SiteTestimonial>(testimonials)),
    [testimonials],
  )
  const slideRows = useMemo(
    () => (Array.isArray(slides) ? slides : unwrapList<HeroSlide>(slides)),
    [slides],
  )

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Content Management"
        title="Site content"
        description="Manage homepage hero slides, testimonials, FAQs, page copy, and the public About page."
      />

      <PageHeader title="Site Content" description="Edit what visitors see on your public website." className="mb-0" />

      <Tabs defaultValue="hero" className="space-y-6">
        <AdminTabsList>
          <AdminTabsTrigger value="hero" icon={Monitor}>Hero Monitor</AdminTabsTrigger>
          <AdminTabsTrigger value="testimonials" icon={Users}>Testimonials</AdminTabsTrigger>
          <AdminTabsTrigger value="faqs" icon={HelpCircle}>FAQs</AdminTabsTrigger>
          <AdminTabsTrigger value="pages" icon={FileText}>Page copy</AdminTabsTrigger>
          <AdminTabsTrigger value="about" icon={BookOpen}>About Page</AdminTabsTrigger>
          <AdminTabsTrigger value="offers" icon={Megaphone}>Offers</AdminTabsTrigger>
        </AdminTabsList>

        <TabsContent value="hero" className="mt-0">
          <div className="grid gap-6 xl:grid-cols-2">
            <PortalPanel>
              <PanelHeading
                icon={Upload}
                title="Upload new slide"
                description={`Images are cropped to ${HERO_MONITOR_LABEL} for the homepage monitor screen.`}
              />
              <div className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slide-title">Title (optional)</Label>
                    <Input
                      id="slide-title"
                      value={newSlide.title}
                      onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                      placeholder="KattaERP Dashboard"
                      className="h-11 rounded-xl bg-[var(--input-background)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slide-alt">Alt text</Label>
                    <Input
                      id="slide-alt"
                      value={newSlide.alt_text}
                      onChange={(e) => setNewSlide({ ...newSlide, alt_text: e.target.value })}
                      placeholder="Dashboard screenshot"
                      className="h-11 rounded-xl bg-[var(--input-background)]"
                    />
                  </div>
                </div>

                <label
                  className={cn(
                    'flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors',
                    uploading
                      ? 'border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/5'
                      : 'border-[var(--border)] bg-[var(--input)]/30 hover:border-[var(--brand-blue)]/40 hover:bg-[var(--brand-blue)]/5',
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-teal)]" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]">
                      <Upload className="h-7 w-7" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {uploading ? 'Uploading…' : 'Click to upload or drag image'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      PNG, JPG, WebP — cropped to {HERO_MONITOR_LABEL} · SVG uploads as-is
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) openCropForFile(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </PortalPanel>

            <PortalPanel>
              <PanelHeading
                icon={Monitor}
                title={`Current slides (${slideRows.length})`}
                description="Toggle visibility or remove slides from the hero carousel."
              />
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : slideRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center">
                    <Monitor className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
                    <p className="text-sm font-medium text-foreground">No slides yet</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">Upload an image to get started.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {slideRows.map((slide) => {
                      const isActive = slide.is_active !== false
                      const imageSrc = resolveMediaUrl(slide.image_url ?? slide.image)

                      return (
                        <li
                          key={slide.id}
                          className={cn(
                            'flex gap-4 rounded-xl border p-3 transition-colors',
                            isActive
                              ? 'border-[var(--border)] bg-[var(--card)]'
                              : 'border-[var(--border)] bg-[var(--input)]/30 opacity-80',
                          )}
                        >
                          <div
                            className="relative w-[96px] shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]"
                            style={{ aspectRatio: '16 / 10' }}
                          >
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={slide.alt_text ?? slide.title ?? 'Slide preview'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {slide.title ?? 'Untitled'}
                              </p>
                              <Badge variant={isActive ? 'success' : 'secondary'} className="text-[10px]">
                                {isActive ? 'Active' : 'Hidden'}
                              </Badge>
                            </div>
                            {slide.alt_text && (
                              <p className="truncate text-xs text-[var(--muted-foreground)]">{slide.alt_text}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Switch checked={isActive} onCheckedChange={() => void toggleSlide(slide)} />
                              <span className="text-xs text-[var(--muted-foreground)]">Show on homepage</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 self-center text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            onClick={() => void deleteSlide(slide.id)}
                            aria-label="Delete slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </PortalPanel>
          </div>
        </TabsContent>

        <TabsContent value="testimonials" className="mt-0">
          <PortalPanel>
            <div className="border-b border-[var(--border)] bg-[var(--input)]/40 px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Testimonials ({testimonialRows.length})
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Add, edit, or remove customer testimonials on the homepage.
                    </p>
                  </div>
                </div>
                <Button type="button" onClick={openAddTestimonial} className="shrink-0 gap-2">
                  <Plus className="h-4 w-4" /> Add testimonial
                </Button>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : testimonialRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
                  <p className="text-sm font-medium text-foreground">No testimonials yet</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Add your first customer testimonial.</p>
                  <Button type="button" className="mt-4 gap-2" onClick={openAddTestimonial}>
                    <Plus className="h-4 w-4" /> Add testimonial
                  </Button>
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {testimonialRows.map((t) => {
                    const isActive = t.is_active !== false

                    return (
                      <li
                        key={t.id}
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border p-4 transition-colors',
                          isActive
                            ? 'border-[var(--border)] bg-[var(--card)]'
                            : 'border-[var(--border)] bg-[var(--input)]/30 opacity-85',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={testimonialAvatar(t.name, t.avatar, t.avatar_url)}
                            alt={t.name}
                            className="h-14 w-14 shrink-0 rounded-full border-2 border-[var(--border)] object-cover bg-[var(--muted)]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                              <Badge variant={isActive ? 'success' : 'secondary'} className="text-[10px]">
                                {isActive ? 'Active' : 'Hidden'}
                              </Badge>
                            </div>
                            <p className="truncate text-xs text-[var(--muted-foreground)]">
                              {[t.designation, t.company].filter(Boolean).join(' · ')}
                            </p>
                            <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                              {'★'.repeat(t.rating ?? 5)}{'☆'.repeat(5 - (t.rating ?? 5))}
                            </p>
                          </div>
                        </div>

                        <p className="line-clamp-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                          &ldquo;{t.content}&rdquo;
                        </p>

                        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
                          <Switch checked={isActive} onCheckedChange={() => void toggleTestimonial(t)} />
                          <span className="mr-auto text-xs text-[var(--muted-foreground)]">Visible</span>
                          <label className="cursor-pointer">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--input-background)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--brand-blue)]/40 hover:text-foreground">
                              <ImagePlus className="h-4 w-4" />
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void uploadAvatar(t.id, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => openEditTestimonial(t)}
                            aria-label="Edit testimonial"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            onClick={() => setDeleteTestimonialId(t.id)}
                            aria-label="Delete testimonial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="faqs" className="mt-0">
          <FaqsContentPanel onChanged={invalidatePublicContent} />
        </TabsContent>

        <TabsContent value="pages" className="mt-0">
          <PageContentPanel onSaved={invalidatePublicContent} />
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          <AboutContentPanel onSaved={invalidatePublicContent} />
        </TabsContent>

        <TabsContent value="offers" className="mt-0">
          <PortalPanel>
            <OffersContentPanel />
          </PortalPanel>
        </TabsContent>
      </Tabs>

      <HeroSlideCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        fileName={cropFileName}
        onOpenChange={(open) => {
          if (!open) closeCrop()
        }}
        onConfirm={uploadSlideImage}
        confirming={uploading}
      />

      <TestimonialFormDialog
        open={testimonialDialogOpen}
        onOpenChange={(open) => {
          setTestimonialDialogOpen(open)
          if (!open) setEditingTestimonial(null)
        }}
        initial={editingTestimonial}
        saving={savingTestimonial}
        onSubmit={saveTestimonial}
      />

      <ConfirmDialog
        open={deleteTestimonialId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTestimonialId(null)
        }}
        title="Delete testimonial?"
        description="This testimonial will be removed from the homepage carousel. This cannot be undone."
        confirmLabel="Delete"
        loading={deletingTestimonial}
        onConfirm={confirmDeleteTestimonial}
      />
    </PortalPage>
  )
}
