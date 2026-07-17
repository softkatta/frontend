import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, FileText, UserRound } from 'lucide-react'
import { PortalPage, PortalWelcome } from '@/components/common/PortalPage'
import { StatCard } from '@/components/common/StatCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function EmployeeDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ pending_leaves: 0, approved_leaves: 0, documents: 0, attendance_this_month: 0 })
  const [employee, setEmployee] = useState<{ employee_code?: string; designation?: string; department?: string; status?: string } | null>(null)
  const [recentLeaves, setRecentLeaves] = useState<Array<{ id: string; leave_type: string; status: string; start_date: string; end_date: string }>>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = asRecord(await employeeApi.dashboard())
      const statsRaw = asRecord(raw.stats)
      setStats({
        pending_leaves: Number(statsRaw.pending_leaves ?? 0),
        approved_leaves: Number(statsRaw.approved_leaves ?? 0),
        documents: Number(statsRaw.documents ?? 0),
        attendance_this_month: Number(statsRaw.attendance_this_month ?? 0),
      })
      const emp = asRecord(raw.employee)
      setEmployee({
        employee_code: asString(emp.employee_code),
        designation: asString(emp.designation),
        department: asString(emp.department),
        status: asString(emp.status),
      })
      setRecentLeaves(unwrapList(raw.recent_leaves).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          leave_type: asString(row.leave_type),
          status: asString(row.status),
          start_date: asString(row.start_date),
          end_date: asString(row.end_date),
        }
      }))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Employee self-service"
        title={`Hello, ${user?.first_name || 'team member'}`}
        description={employee ? `${employee.designation || 'Employee'} · ${employee.department || 'SoftKatta'} · ID ${employee.employee_code || '—'}` : 'Manage leave, attendance, and HR documents.'}
        aside={employee?.status ? <Badge className="capitalize rounded-full px-3">{employee.status.replace('_', ' ')}</Badge> : null}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending leave" value={stats.pending_leaves} icon={CalendarDays} gradient="amber" />
        <StatCard title="Approved leave" value={stats.approved_leaves} icon={CalendarDays} gradient="green" />
        <StatCard title="My documents" value={stats.documents} icon={FileText} gradient="blue" />
        <StatCard title="Attendance this month" value={stats.attendance_this_month} icon={ClipboardList} gradient="purple" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-display font-semibold mb-3">Quick actions</h2>
          <div className="grid gap-2">
            <Link to="/employee/leave" className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--input)]/60">Apply for leave</Link>
            <Link to="/employee/attendance" className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--input)]/60">Submit attendance</Link>
            <Link to="/employee/documents" className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--input)]/60">View / upload documents</Link>
            <Link to="/employee/profile" className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--input)]/60 inline-flex items-center gap-2"><UserRound className="h-4 w-4" /> Update profile</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-display font-semibold mb-3">Recent leave requests</h2>
          {recentLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentLeaves.map((leave) => (
                <li key={leave.id} className="flex items-center justify-between gap-2 text-sm border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="capitalize">{leave.leave_type} · {formatDate(leave.start_date)} – {formatDate(leave.end_date)}</span>
                  <Badge variant={leave.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{leave.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalPage>
  )
}
