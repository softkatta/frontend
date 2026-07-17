import { useCallback, useState } from 'react'
import { CalendarDays, Check, X } from 'lucide-react'
import { PortalPanel } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminPanelHeader } from '@/components/admin/AdminUi'
import { adminApi } from '@/services/api'
import { LEAVE_STATUSES } from '@/lib/hrConstants'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

type LeaveRow = {
  id: string
  employee_name: string
  employee_code: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  status: string
  reason: string
}

function mapLeave(raw: unknown): LeaveRow {
  const row = asRecord(raw)
  const employee = asRecord(row.employee)
  return {
    id: asString(row.id),
    employee_name: asString(employee.full_name),
    employee_code: asString(employee.employee_code),
    leave_type: asString(row.leave_type),
    start_date: asString(row.start_date),
    end_date: asString(row.end_date),
    total_days: Number(row.total_days ?? 0),
    status: asString(row.status),
    reason: asString(row.reason),
  }
}

export function HrLeaveRequestsPanel() {
  const fetcher = useCallback(() => adminApi.leaveRequests.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapLeave), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleStatus = async (row: LeaveRow, status: string) => {
    setUpdating(row.id)
    try {
      await adminApi.leaveRequests.update(row.id, { status })
      toast({ title: 'Leave request updated', variant: 'success' })
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
        icon={CalendarDays}
        title="Leave requests"
        description="Employees apply from the employee portal. Approve or reject here."
      />
      <div className="p-4 sm:p-6">
        {error ? (
          <p className="text-sm text-destructive py-8 text-center">{error}</p>
        ) : (
          <DataTable
            embedded
            searchKeys={['employee_name', 'employee_code', 'leave_type', 'reason']}
            searchPlaceholder="Search leave requests..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [{ value: 'all', label: 'All' }, ...LEAVE_STATUSES.map((s) => ({ value: s.value, label: s.label }))],
              },
            ]}
            data={items}
            emptyTitle="No leave requests"
            emptyDescription="Leave applications submitted by employees will appear here."
            columns={[
              { key: 'employee_name', header: 'Employee', className: 'font-medium' },
              { key: 'employee_code', header: 'ID', className: 'font-mono text-xs' },
              { key: 'leave_type', header: 'Type', render: (row) => <span className="capitalize">{row.leave_type}</span> },
              { key: 'dates', header: 'Dates', render: (row) => `${formatDate(row.start_date)} – ${formatDate(row.end_date)} (${row.total_days}d)` },
              { key: 'status', header: 'Status', render: (row) => <Badge className="capitalize">{row.status}</Badge> },
              { key: 'actions', header: '', className: 'w-[140px] text-right', render: (row) => row.status === 'pending' ? (
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
