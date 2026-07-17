import { useCallback, useEffect, useState } from 'react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { employeeApi } from '@/services/api/modules/employee.api'
import { LEAVE_TYPES } from '@/lib/hrConstants'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type LeaveRow = { id: string; leave_type: string; start_date: string; end_date: string; total_days: number; status: string; reason: string }

export default function EmployeeLeavePage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<LeaveRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' })
  const [attachment, setAttachment] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.leave.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          leave_type: asString(row.leave_type),
          start_date: asString(row.start_date),
          end_date: asString(row.end_date),
          total_days: Number(row.total_days ?? 0),
          status: asString(row.status),
          reason: asString(row.reason),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load leave requests', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await employeeApi.leave.apply({ ...form, attachment: attachment ?? undefined })
      toast({ title: 'Leave application submitted', variant: 'success' })
      setForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '' })
      setAttachment(null)
      await load()
    } catch (err) {
      toast({ title: 'Submission failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome eyebrow="HR self-service" title="Leave application" description="Apply for leave here. HR will review and approve in the admin panel." />

      <PortalPanel>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Leave type</Label>
            <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
              {LEAVE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Supporting document (optional)</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>From date *</Label>
            <Input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>To date *</Label>
            <Input required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Reason *</Label>
            <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="rounded-xl">{submitting ? 'Submitting…' : 'Submit leave application'}</Button>
          </div>
        </form>
      </PortalPanel>

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <DataTable
              embedded
              data={rows}
              emptyTitle="No leave applications"
              columns={[
                { key: 'leave_type', header: 'Type', render: (row) => <span className="capitalize">{row.leave_type}</span> },
                { key: 'dates', header: 'Dates', render: (row) => `${formatDate(row.start_date)} – ${formatDate(row.end_date)}` },
                { key: 'total_days', header: 'Days' },
                { key: 'status', header: 'Status', render: (row) => <Badge className="capitalize">{row.status}</Badge> },
                { key: 'reason', header: 'Reason', className: 'max-w-[200px] truncate' },
              ]}
            />
          )}
        </div>
      </PortalPanel>
    </PortalPage>
  )
}
