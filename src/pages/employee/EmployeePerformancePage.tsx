import { useCallback, useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type ReviewRow = {
  id: string
  cycle_label: string
  period_start: string
  period_end: string
  reviewer_name: string
  overall_rating: string
  score: string
  strengths: string
  improvements: string
  goals: string
  manager_comments: string
  employee_comments: string
  status: string
  shared_at: string
  acknowledged_at: string
}

const RATING_LABELS: Record<string, string> = {
  exceeds: 'Exceeds expectations',
  meets: 'Meets expectations',
  partially_meets: 'Partially meets',
  needs_improvement: 'Needs improvement',
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'acknowledged') return 'default'
  if (status === 'shared') return 'secondary'
  return 'outline'
}

export default function EmployeePerformancePage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [selected, setSelected] = useState<ReviewRow | null>(null)
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.performance.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          cycle_label: asString(row.cycle_label),
          period_start: asString(row.period_start),
          period_end: asString(row.period_end),
          reviewer_name: asString(row.reviewer_name),
          overall_rating: asString(row.overall_rating) || 'meets',
          score: asString(row.score),
          strengths: asString(row.strengths),
          improvements: asString(row.improvements),
          goals: asString(row.goals),
          manager_comments: asString(row.manager_comments),
          employee_comments: asString(row.employee_comments),
          status: asString(row.status) || 'shared',
          shared_at: asString(row.shared_at),
          acknowledged_at: asString(row.acknowledged_at),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load reviews', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const openReview = (row: ReviewRow) => {
    setSelected(row)
    setComments(row.employee_comments || '')
  }

  const acknowledge = async () => {
    if (!selected || selected.status !== 'shared') return
    setSaving(true)
    try {
      await employeeApi.performance.acknowledge(selected.id, {
        employee_comments: comments.trim() || null,
      })
      toast({ title: 'Review acknowledged', variant: 'success' })
      setSelected(null)
      await load()
    } catch (err) {
      toast({ title: 'Acknowledge failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const pending = rows.filter((r) => r.status === 'shared').length

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Feedback"
        title="Performance reviews"
        description="Shared review cycles and feedback from your manager."
        aside={pending > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <span className="font-semibold">{pending}</span> to acknowledge
          </div>
        ) : undefined}
      />

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 font-medium">No reviews shared yet</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                When HR shares a performance review with you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openReview(row)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors hover:bg-[var(--input)]/40',
                    row.status === 'shared'
                      ? 'border-[var(--brand-blue)]/30 bg-[var(--brand-blue)]/5'
                      : 'border-[var(--border)] bg-[var(--card)]',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.cycle_label}</p>
                        <Badge variant={statusVariant(row.status)} className="capitalize">{row.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {RATING_LABELS[row.overall_rating] ?? row.overall_rating}
                        {row.score ? ` · ${row.score}/5` : ''}
                        {row.reviewer_name ? ` · ${row.reviewer_name}` : ''}
                      </p>
                      {(row.period_start || row.period_end) ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {row.period_start ? formatDate(row.period_start) : '…'}
                          {' – '}
                          {row.period_end ? formatDate(row.period_end) : '…'}
                        </p>
                      ) : null}
                    </div>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg shrink-0">
                      {row.status === 'shared' ? 'Review & acknowledge' : 'View'}
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PortalPanel>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.cycle_label}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(selected.status)} className="capitalize">{selected.status}</Badge>
                <span className="text-[var(--muted-foreground)]">
                  {RATING_LABELS[selected.overall_rating] ?? selected.overall_rating}
                  {selected.score ? ` · ${selected.score}/5` : ''}
                </span>
              </div>
              {([
                ['Strengths', selected.strengths],
                ['Improvements', selected.improvements],
                ['Goals', selected.goals],
                ['Manager comments', selected.manager_comments],
              ] as const).map(([label, value]) => value ? (
                <div key={label}>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-1 whitespace-pre-wrap">{value}</p>
                </div>
              ) : null)}
              {selected.status === 'shared' ? (
                <div className="space-y-2">
                  <Label>Your comments (optional)</Label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                    placeholder="Add a short acknowledgement note…"
                  />
                </div>
              ) : selected.employee_comments ? (
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Your comments</p>
                  <p className="mt-1 whitespace-pre-wrap">{selected.employee_comments}</p>
                </div>
              ) : null}
              {selected.acknowledged_at ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Acknowledged {formatDate(selected.acknowledged_at)}
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected?.status === 'shared' ? (
              <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void acknowledge()}>
                {saving ? 'Saving…' : 'Acknowledge'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  )
}
