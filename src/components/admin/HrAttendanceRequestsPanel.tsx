import { useCallback, useState } from 'react'
import { Check, ClipboardList, X } from 'lucide-react'
import { PortalPanel } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminPanelHeader } from '@/components/admin/AdminUi'
import { adminApi } from '@/services/api'
import { ATTENDANCE_STATUSES } from '@/lib/hrConstants'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type AttendanceRow = {
  id: string
  employee_name: string
  employee_code: string
  work_date: string
  check_in?: string
  check_out?: string
  work_mode: string
  status: string
}

function mapAttendance(raw: unknown): AttendanceRow {
  const row = asRecord(raw)
  const employee = asRecord(row.employee)
  return {
    id: asString(row.id),
    employee_name: asString(employee.full_name),
    employee_code: asString(employee.employee_code),
    work_date: asString(row.work_date),
    check_in: asString(row.check_in),
    check_out: asString(row.check_out),
    work_mode: asString(row.work_mode, 'office'),
    status: asString(row.status),
  }
}

export function HrAttendanceRequestsPanel() {
  const fetcher = useCallback(() => adminApi.attendanceRecords.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAttendance), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleStatus = async (row: AttendanceRow, status: string) => {
    setUpdating(row.id)
    try {
      await adminApi.attendanceRecords.update(row.id, { status })
      toast({ title: 'Attendance record updated', variant: 'success' })
      await reload()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  return (
    <PortalPanel>
      <AdminPanelHeader
        icon={ClipboardList}
        title="Attendance records"
        description="Employees submit attendance from the employee portal. Review and approve here."
      />
      <div className="p-4 sm:p-6">
        {error ? (
          <p className="text-sm text-destructive py-8 text-center">{error}</p>
        ) : (
          <DataTable
            embedded
            searchKeys={['employee_name', 'employee_code', 'work_mode']}
            searchPlaceholder="Search attendance..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [{ value: 'all', label: 'All' }, ...ATTENDANCE_STATUSES.map((s) => ({ value: s.value, label: s.label }))],
              },
            ]}
            data={items}
            emptyTitle="No attendance records"
            emptyDescription="Daily attendance submitted by employees will appear here."
            columns={[
              { key: 'employee_name', header: 'Employee', className: 'font-medium' },
              { key: 'employee_code', header: 'ID', className: 'font-mono text-xs' },
              { key: 'work_date', header: 'Date', render: (row) => formatDate(row.work_date) },
              { key: 'check_in', header: 'In', render: (row) => row.check_in || '—' },
              { key: 'check_out', header: 'Out', render: (row) => row.check_out || '—' },
              { key: 'work_mode', header: 'Mode', render: (row) => <span className="uppercase text-xs">{row.work_mode}</span> },
              { key: 'status', header: 'Status', render: (row) => <Badge className="capitalize">{row.status}</Badge> },
              { key: 'actions', header: '', className: 'w-[140px] text-right', render: (row) => row.status === 'submitted' ? (
                <div className="flex justify-end gap-1">
                  <Button type="button" size="sm" className="rounded-lg h-8 gap-1" disabled={updating === row.id} onClick={() => void handleStatus(row, 'approved')}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="rounded-lg h-8 gap-1" disabled={updating === row.id} onClick={() => void handleStatus(row, 'rejected')}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              ) : null },
            ]}
          />
        )}
      </div>
    </PortalPanel>
  )
}
