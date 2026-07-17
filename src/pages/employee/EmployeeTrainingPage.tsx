import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, GraduationCap } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type TrainingRow = {
  id: string
  title: string
  description: string
  category: string
  provider: string
  mode: string
  duration_hours: string
  starts_at: string
  due_at: string
  status: string
  completion_percent: number
  notes: string
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'completed') return 'default'
  if (status === 'in_progress') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

export default function EmployeeTrainingPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<TrainingRow[]>([])
  const [selected, setSelected] = useState<TrainingRow | null>(null)
  const [percent, setPercent] = useState('0')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.training.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          title: asString(row.title),
          description: asString(row.description),
          category: asString(row.category) || 'other',
          provider: asString(row.provider),
          mode: asString(row.mode) || 'online',
          duration_hours: asString(row.duration_hours),
          starts_at: asString(row.starts_at),
          due_at: asString(row.due_at),
          status: asString(row.status) || 'assigned',
          completion_percent: Number(row.completion_percent ?? 0),
          notes: asString(row.notes),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load training', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const openProgress = (row: TrainingRow) => {
    setSelected(row)
    setPercent(String(row.completion_percent))
  }

  const saveProgress = async (markComplete = false) => {
    if (!selected) return
    setSaving(true)
    try {
      const payload = markComplete
        ? { status: 'completed', completion_percent: 100 }
        : { completion_percent: Number(percent || 0) }
      await employeeApi.training.update(selected.id, payload)
      toast({ title: markComplete ? 'Marked complete' : 'Progress saved', variant: 'success' })
      setSelected(null)
      await load()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const pending = rows.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Learning"
        title="Training"
        description="Courses and modules assigned to you by SoftKatta."
        aside={pending > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <span className="font-semibold">{pending}</span> in progress
          </div>
        ) : undefined}
      />

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="mt-3 font-medium">No training assigned</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                When HR assigns a course, it will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    'rounded-xl border p-4',
                    row.status === 'completed'
                      ? 'border-[var(--border)] bg-[var(--card)]'
                      : 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/5',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.title}</p>
                        <Badge variant={statusVariant(row.status)} className="capitalize">
                          {row.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {row.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{row.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        <span className="capitalize">{row.category.replace(/_/g, ' ')}</span>
                        {' · '}
                        <span className="capitalize">{row.mode.replace(/_/g, ' ')}</span>
                        {row.provider ? ` · ${row.provider}` : ''}
                        {row.due_at ? ` · Due ${formatDate(row.due_at)}` : ''}
                      </p>
                      <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--input)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-blue)] transition-all"
                          style={{ width: `${Math.min(100, row.completion_percent)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{row.completion_percent}% complete</p>
                    </div>
                    {row.status !== 'completed' && row.status !== 'cancelled' ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-lg shrink-0" onClick={() => openProgress(row)}>
                        Update progress
                      </Button>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-[var(--brand-blue)] shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PortalPanel>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Completion %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelected(null)}>Cancel</Button>
            <Button type="button" variant="secondary" className="rounded-xl" disabled={saving} onClick={() => void saveProgress(false)}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void saveProgress(true)}>
              Mark complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  )
}
