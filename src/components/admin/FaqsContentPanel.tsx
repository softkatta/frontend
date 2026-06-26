import { useCallback, useEffect, useMemo, useState } from 'react'
import { HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { FaqFormDialog, type FaqFormValues } from '@/components/admin/FaqFormDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PortalPanel } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Switch } from '@/components/ui/switch'
import { adminApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import type { SiteFaq } from '@/types/siteContent'

type FaqsContentPanelProps = {
  onChanged: () => void
}

export function FaqsContentPanel({ onChanged }: FaqsContentPanelProps) {
  const [faqs, setFaqs] = useState<SiteFaq[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<SiteFaq | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setFaqs(unwrapList<SiteFaq>(await adminApi.faqs.list()))
    } catch (error) {
      toast({ title: 'Failed to load FAQs', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const rows = useMemo(() => faqs, [faqs])

  const openAdd = () => {
    setEditingFaq(null)
    setDialogOpen(true)
  }

  const openEdit = (faq: SiteFaq) => {
    setEditingFaq(faq)
    setDialogOpen(true)
  }

  const saveFaq = async (values: FaqFormValues) => {
    setSaving(true)
    try {
      if (editingFaq?.id != null) {
        await adminApi.faqs.update(editingFaq.id, values)
        toast({ title: 'FAQ updated', variant: 'success' })
      } else {
        await adminApi.faqs.create({
          ...values,
          sort_order: rows.length,
        })
        toast({ title: 'FAQ added', variant: 'success' })
      }
      setDialogOpen(false)
      setEditingFaq(null)
      await load()
      onChanged()
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    setDeleting(true)
    try {
      await adminApi.faqs.delete(deleteId)
      toast({ title: 'FAQ deleted', variant: 'success' })
      setDeleteId(null)
      await load()
      onChanged()
    } catch (error) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (faq: SiteFaq) => {
    const active = faq.is_active !== false
    try {
      await adminApi.faqs.update(faq.id, { is_active: !active })
      await load()
      onChanged()
    } catch (error) {
      toast({ title: 'Update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <>
      <PortalPanel>
        <div className="border-b border-[var(--border)] bg-[var(--input)]/40 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  FAQs ({rows.length})
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Manage questions shown on the homepage and product pages.
                </p>
              </div>
            </div>
            <Button type="button" onClick={openAdd} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Add FAQ
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/20 px-6 py-12 text-center">
              <HelpCircle className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="text-sm font-medium text-foreground">No FAQs yet</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Add your first frequently asked question.</p>
              <Button type="button" className="mt-4 gap-2" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add FAQ
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((faq) => {
                const isActive = faq.is_active !== false
                return (
                  <li
                    key={faq.id}
                    className={cn(
                      'rounded-xl border p-4',
                      isActive ? 'border-[var(--border)] bg-[var(--card)]' : 'border-[var(--border)] bg-[var(--input)]/30 opacity-85',
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {faq.category && <Badge variant="secondary">{faq.category}</Badge>}
                          <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Active' : 'Hidden'}</Badge>
                        </div>
                        <p className="font-semibold text-foreground">{faq.question}</p>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Switch checked={isActive} onCheckedChange={() => void toggleActive(faq)} aria-label="Toggle FAQ visibility" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(faq)} aria-label="Edit FAQ">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setDeleteId(faq.id)}
                          aria-label="Delete FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PortalPanel>

      <FaqFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingFaq}
        saving={saving}
        onSubmit={saveFaq}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete FAQ?"
        description="This question will be removed from the public site. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
