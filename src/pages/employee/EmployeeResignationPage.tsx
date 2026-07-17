import { useCallback, useEffect, useState } from 'react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

export default function EmployeeResignationPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exitRecord, setExitRecord] = useState<{ status?: string; resignation_date?: string; last_working_day?: string; reason?: string } | null>(null)
  const [form, setForm] = useState({ resignation_date: new Date().toISOString().slice(0, 10), last_working_day: '', reason: '' })
  const [letter, setLetter] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await employeeApi.resignation.get()
      if (raw) {
        const row = asRecord(raw)
        setExitRecord({
          status: asString(row.status),
          resignation_date: asString(row.resignation_date),
          last_working_day: asString(row.last_working_day),
          reason: asString(row.reason),
        })
      } else {
        setExitRecord(null)
      }
    } catch {
      setExitRecord(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await employeeApi.resignation.submit({ ...form, resignation_letter: letter ?? undefined })
      toast({ title: 'Resignation submitted to HR', variant: 'success' })
      await load()
    } catch (err) {
      toast({ title: 'Submission failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome eyebrow="Exit" title="Resignation" description="Submit your resignation letter here. HR will process exit formalities." />

      {exitRecord ? (
        <PortalPanel>
          <div className="p-4 sm:p-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Exit status</span>
              <Badge className="capitalize">{exitRecord.status?.replace('_', ' ') || 'initiated'}</Badge>
            </div>
            <p><span className="text-muted-foreground">Resignation date:</span> {exitRecord.resignation_date ? formatDate(exitRecord.resignation_date) : '—'}</p>
            <p><span className="text-muted-foreground">Last working day:</span> {exitRecord.last_working_day ? formatDate(exitRecord.last_working_day) : 'Pending HR confirmation'}</p>
            <p><span className="text-muted-foreground">Reason:</span> {exitRecord.reason || '—'}</p>
          </div>
        </PortalPanel>
      ) : (
        <PortalPanel>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resignation date *</Label>
              <Input required type="date" value={form.resignation_date} onChange={(e) => setForm({ ...form, resignation_date: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Preferred last working day</Label>
              <Input type="date" value={form.last_working_day} onChange={(e) => setForm({ ...form, last_working_day: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Reason *</Label>
              <textarea required rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Resignation letter (PDF / image)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setLetter(e.target.files?.[0] ?? null)} className="h-11 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting} className="rounded-xl">{submitting ? 'Submitting…' : 'Submit resignation'}</Button>
            </div>
          </form>
        </PortalPanel>
      )}
    </PortalPage>
  )
}
