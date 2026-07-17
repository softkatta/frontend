import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, CalendarDays, ClipboardList, Inbox, UserRound, Users, BadgeCheck } from 'lucide-react'
import { PortalPage, PortalWelcome } from '@/components/common/PortalPage'
import { StatCard } from '@/components/common/StatCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapAdminCareer, mapAdminJobApplication } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'

export default function HrDashboardPage() {
  const careersFetcher = useCallback(() => adminApi.careers.list(), [])
  const careersMapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminCareer), [])
  const { items: careers, loading: careersLoading } = useListData(careersFetcher, careersMapper)

  const appsFetcher = useCallback(() => adminApi.jobApplications.list(), [])
  const appsMapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminJobApplication), [])
  const { items: applications, loading: appsLoading } = useListData(appsFetcher, appsMapper)

  const employeesFetcher = useCallback(() => adminApi.employees.list(), [])
  const employeesMapper = useCallback((raw: unknown) => unwrapList(raw), [])
  const { items: employees, loading: employeesLoading } = useListData(employeesFetcher, employeesMapper)

  const stats = useMemo(() => ({
    openings: careers.length,
    published: careers.filter((row) => row.is_published).length,
    applications: applications.length,
    newApplications: applications.filter((row) => row.status === 'applied').length,
    employees: employees.length,
  }), [careers, applications, employees])

  const loading = careersLoading || appsLoading || employeesLoading

  if (loading) {
    return (
      <PortalPage className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </PortalPage>
    )
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Human Resources"
        title="HR dashboard"
        description="Manage hiring, employee records, leave, and attendance from one place."
        aside={(
          <Button asChild className="rounded-xl glow-btn">
            <Link to="/hr/openings">Job openings</Link>
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Job openings" value={stats.openings} icon={Briefcase} gradient="blue" />
        <StatCard title="Published live" value={stats.published} icon={Building2} gradient="teal" />
        <StatCard title="Applications" value={stats.applications} icon={Inbox} gradient="purple" />
        <StatCard title="Employees" value={stats.employees} icon={Users} gradient="green" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link to="/hr/openings" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <Briefcase className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Job openings</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Create and publish career listings</p>
        </Link>
        <Link to="/hr/applications" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <Inbox className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Applications</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{stats.newApplications} new application{stats.newApplications === 1 ? '' : 's'} waiting</p>
        </Link>
        <Link to="/hr/employees" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <UserRound className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Employees</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Documents, portal access, and exit process</p>
        </Link>
        <Link to="/hr/leave" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <CalendarDays className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Leave requests</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Approve or reject employee leave</p>
        </Link>
        <Link to="/hr/attendance" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <ClipboardList className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Review attendance submissions</p>
        </Link>
        <Link to="/hr/company-roles" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--input)]/30">
          <BadgeCheck className="h-5 w-5 text-[var(--brand-blue)] mb-3" />
          <h3 className="font-semibold">Company roles</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Job titles and employee portal menus</p>
        </Link>
      </div>
    </PortalPage>
  )
}
