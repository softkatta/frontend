import { useCallback, useEffect, useState } from 'react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { employeeApi } from '@/services/api/modules/employee.api'
import { WORK_MODES } from '@/lib/hrConstants'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type AttendanceRow = { id: string; work_date: string; check_in?: string; check_out?: string; work_mode: string; status: string }

export default function EmployeeAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ work_date: new Date().toISOString().slice(0, 10), check_in: '', check_out: '', work_mode: 'office', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.attendance.list())
      setRows(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          work_date: asString(row.work_date),
          check_in: asString(row.check_in),
          check_out: asString(row.check_out),
          work_mode: asString(row.work_mode, 'office'),
          status: asString(row.status),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load attendance', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await employeeApi.attendance.submit(form)
      toast({ title: 'Attendance submitted', variant: 'success' })
      await load()
    } catch (err) {
      toast({ title: 'Submission failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome eyebrow="HR self-service" title="Attendance" description="Mark your daily attendance. HR reviews records in admin." />

      <PortalPanel>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input required type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Work mode</Label>
            <select value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })} className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
              {WORK_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Check in</Label>
            <Input type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Check out</Label>
            <Input type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="rounded-xl">{submitting ? 'Saving…' : 'Submit attendance'}</Button>
          </div>
        </form>
      </PortalPanel>

      <PortalPanel>
        <div className="p-4 sm:p-6">
          {loading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <DataTable
              embedded
              data={rows}
              emptyTitle="No attendance records"
              columns={[
                { key: 'work_date', header: 'Date', render: (row) => formatDate(row.work_date) },
                { key: 'check_in', header: 'In', render: (row) => row.check_in || '—' },
                { key: 'check_out', header: 'Out', render: (row) => row.check_out || '—' },
                { key: 'work_mode', header: 'Mode', render: (row) => <span className="uppercase">{row.work_mode}</span> },
                { key: 'status', header: 'Status', render: (row) => <Badge className="capitalize">{row.status}</Badge> },
              ]}
            />
          )}
        </div>
      </PortalPanel>
    </PortalPage>
  )
}
