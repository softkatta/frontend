import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Eye,
  Inbox,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  BadgeCheck,
} from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { AdminPanelHeader, AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminUi'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { CareerFormDialog, type CareerFormValues } from '@/components/admin/CareerFormDialog'
import { HrEmployeesPanel } from '@/components/admin/HrEmployeesPanel'
import { CompanyRolesPanel } from '@/components/admin/CompanyRolesPanel'
import { HrAttendanceRequestsPanel } from '@/components/admin/HrAttendanceRequestsPanel'
import { HrLeaveRequestsPanel } from '@/components/admin/HrLeaveRequestsPanel'
import { adminApi } from '@/services/api'
import { APPLICATION_STATUSES, getApplicationDocumentLabel } from '@/lib/hrConstants'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { asRecord, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminCareer, mapAdminJobApplication } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import { useAuth } from '@/hooks/useAuth'

type CareerRow = ReturnType<typeof mapAdminCareer> & { publish_status: string }
type ApplicationRow = ReturnType<typeof mapAdminJobApplication>

const STATUS_OPTIONS = APPLICATION_STATUSES

const HR_ONLY_TABS = new Set(['roles'])

const CAREERS_TAB_PERMISSIONS: Record<string, string> = {
  openings: 'hr.careers.view',
  applications: 'hr.applications.view',
  employees: 'hr.employees.view',
  leave: 'hr.leave.view',
  attendance: 'hr.attendance.view',
  roles: 'hr.company-roles.view',
}

const HR_TAB_PATHS: Record<string, string> = {
  openings: '/hr/openings',
  applications: '/hr/applications',
  employees: '/hr/employees',
  leave: '/hr/leave',
  attendance: '/hr/attendance',
  roles: '/hr/company-roles',
}

interface CareersManagementProps {
  initialTab?: string
}

function resolveCareersTab(tab: string | undefined, isHrPortal: boolean, allowedTabs: string[]): string {
  if (allowedTabs.length === 0) return ''
  const fallback = allowedTabs[0]
  if (!tab) return fallback
  if (tab === 'permissions') return fallback
  if (!isHrPortal && HR_ONLY_TABS.has(tab)) return fallback
  if (!allowedTabs.includes(tab)) return fallback
  return tab
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'applied') return 'default'
  if (status === 'shortlisted' || status === 'selected' || status === 'joined') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

function ApplicationStatusPills({
  current,
  disabled,
  onSelect,
}: {
  current: string
  disabled?: boolean
  onSelect: (status: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((status) => (
        <Button
          key={status.value}
          type="button"
          size="sm"
          variant={current === status.value ? 'default' : 'outline'}
          disabled={disabled}
          className="rounded-lg text-xs"
          onClick={() => onSelect(status.value)}
        >
          {status.label}
        </Button>
      ))}
    </div>
  )
}

export default function CareersManagement({ initialTab: initialTabProp }: CareersManagementProps) {
  const { hasRole, can } = useAuth()
  const isHrPortal = hasRole('hr')
  const navigate = useNavigate()
  const location = useLocation()
  const stateTab = (location.state as { tab?: string } | null)?.tab

  const allowedTabs = useMemo(() => (
    Object.keys(CAREERS_TAB_PERMISSIONS).filter((tab) => {
      if (HR_ONLY_TABS.has(tab) && !isHrPortal) return false
      return can(CAREERS_TAB_PERMISSIONS[tab])
    })
  ), [can, isHrPortal])

  const canManageCareers = can('hr.careers.manage')
  const canManageApplications = can('hr.applications.manage')
  const canExportApplications = can('hr.applications.export')
  const canManageEmployees = can('hr.employees.manage')
  const canViewCareers = can('hr.careers.view')
  const canViewApplications = can('hr.applications.view')

  const resolvedInitial = resolveCareersTab(initialTabProp ?? stateTab, isHrPortal, allowedTabs)
  const fetcher = useCallback(() => {
    if (!canViewCareers) return Promise.resolve([])
    return adminApi.careers.list()
  }, [canViewCareers])
  const mapper = useCallback(
    (raw: unknown) =>
      unwrapList(raw).map((item) => {
        const row = mapAdminCareer(item)
        return { ...row, publish_status: row.is_published ? 'published' : 'draft' }
      }),
    [],
  )
  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const appFetcher = useCallback(() => {
    if (!canViewApplications) return Promise.resolve([])
    return adminApi.jobApplications.list()
  }, [canViewApplications])
  const appMapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminJobApplication), [])
  const {
    items: applications,
    loading: appsLoading,
    error: appsError,
    reload: reloadApps,
  } = useListData(appFetcher, appMapper)

  const [activeTab, setActiveTab] = useState(resolvedInitial ?? 'openings')

  useEffect(() => {
    setActiveTab(resolveCareersTab(initialTabProp ?? stateTab, isHrPortal, allowedTabs))
  }, [initialTabProp, stateTab, isHrPortal, allowedTabs, location.pathname])

  const handleTabChange = useCallback((tab: string) => {
    if (!allowedTabs.includes(tab)) return
    if (isHrPortal && HR_TAB_PATHS[tab]) {
      navigate(HR_TAB_PATHS[tab])
      return
    }
    setActiveTab(tab)
  }, [allowedTabs, isHrPortal, navigate])
  const [detail, setDetail] = useState<CareerRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CareerRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [appDetail, setAppDetail] = useState<ApplicationRow | null>(null)
  const [appDeleteTarget, setAppDeleteTarget] = useState<ApplicationRow | null>(null)
  const [appDeleting, setAppDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const stats = useMemo(() => ({
    openings: items.length,
    published: items.filter((row) => row.is_published).length,
    applications: applications.length,
    newApplications: applications.filter((row) => row.status === 'applied').length,
  }), [items, applications])

  const buildPayload = (values: CareerFormValues) => ({
    title: values.title,
    slug: values.slug,
    department: values.department || null,
    company_role_id: values.company_role_id ? Number(values.company_role_id) : null,
    location: values.location || null,
    employment_type: values.employment_type,
    experience_required: values.experience_required || null,
    salary_display: values.salary_display || null,
    excerpt: values.excerpt || null,
    description: values.description,
    requirements: values.requirements || null,
    apply_email: values.apply_email || null,
    apply_url: values.apply_url || null,
    sort_order: values.sort_order,
    is_published: values.is_published,
  })

  const handleSave = async (values: CareerFormValues) => {
    setSaving(true)
    try {
      if (editTarget) {
        await adminApi.careers.update(editTarget.id, buildPayload(values))
        toast({ title: 'Opening updated', variant: 'success' })
      } else {
        await adminApi.careers.create(buildPayload(values))
        toast({ title: 'Opening created', variant: 'success' })
      }
      setFormOpen(false)
      setEditTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.careers.delete(deleteTarget.id)
      toast({ title: 'Opening deleted', variant: 'success' })
      setDeleteTarget(null)
      await reload()
      await reloadApps()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleAppDelete = async () => {
    if (!appDeleteTarget) return
    setAppDeleting(true)
    try {
      await adminApi.jobApplications.delete(appDeleteTarget.id)
      toast({ title: 'Application deleted', variant: 'success' })
      setAppDeleteTarget(null)
      if (appDetail?.id === appDeleteTarget.id) setAppDetail(null)
      await reloadApps()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setAppDeleting(false)
    }
  }

  const [hrRemarks, setHrRemarks] = useState('')
  const [portalLoginEmail, setPortalLoginEmail] = useState('')
  const [convertCompanyRoleId, setConvertCompanyRoleId] = useState('')
  const [companyRoles, setCompanyRoles] = useState<Array<{ id: string; name: string; category: string }>>([])

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await adminApi.jobApplications.export({ format })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `applications-${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'csv'}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Export failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleConvertEmployee = async (application: ApplicationRow) => {
    try {
      const payload: { portal_email?: string; company_role_id?: string } = {}
      const trimmedPortalEmail = portalLoginEmail.trim()
      if (trimmedPortalEmail) {
        payload.portal_email = trimmedPortalEmail
      }
      if (convertCompanyRoleId) {
        payload.company_role_id = convertCompanyRoleId
      }

      const res = asRecord(await adminApi.jobApplications.convertEmployee(application.id, payload))
      const portal = asRecord(res.portal_login)

      if (portal.skipped === true) {
        toast({
          title: 'Employee created — portal login not created',
          description: `${String(portal.reason ?? 'Email already used by another account.')}\n\nGo to Employees tab → open profile → use "Create & email login" with a different portal email.`,
          variant: 'destructive',
        })
      } else {
        const tempPassword = portal.temporary_password as string | null | undefined
        const emailed = Boolean(portal.credentials_emailed)
        toast({
          title: 'Employee profile created',
          description: emailed
            ? tempPassword
              ? `Login details emailed to ${portal.email}.`
              : `Employee portal access details emailed to ${portal.email}.`
            : tempPassword
              ? `Email could not be sent. Share manually: ${portal.email} / ${tempPassword} at /employee`
              : `Employee can login at /employee with ${portal.email}`,
          variant: emailed || !tempPassword ? 'success' : 'destructive',
        })
      }

      setAppDetail(null)
      setPortalLoginEmail('')
      setConvertCompanyRoleId('')
      await reloadApps()
      if (isHrPortal) {
        navigate('/hr/employees')
      } else {
        setActiveTab('employees')
      }
    } catch (err) {
      toast({ title: 'Conversion failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDownloadDoc = async (applicationId: string, documentId: string) => {
    try {
      const res = await adminApi.jobApplications.downloadDocument(applicationId, documentId)
      window.open(res.download_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({ title: 'Download failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleStatusChange = async (application: ApplicationRow, status: string) => {
    setStatusUpdating(true)
    try {
      await adminApi.jobApplications.update(application.id, {
        status,
        hr_remarks: hrRemarks || application.hr_remarks,
      })
      toast({ title: 'Status updated', variant: 'success' })
      await reloadApps()
      if (appDetail?.id === application.id) {
        setAppDetail({ ...application, status })
      }
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setStatusUpdating(false)
    }
  }

  const pageLoading = (canViewCareers && loading) || (canViewApplications && appsLoading)

  const loadCompanyRoles = useCallback(async () => {
    try {
      const rows = unwrapList(await adminApi.companyRoles.list({ active_only: true }))
      setCompanyRoles(rows.map((item) => {
        const row = asRecord(item)
        return {
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
          category: String(row.category ?? 'Other'),
        }
      }))
    } catch {
      setCompanyRoles([])
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'applications' || activeTab === 'employees' || activeTab === 'roles') {
      void loadCompanyRoles()
    }
  }, [activeTab, loadCompanyRoles])

  if (pageLoading) {
    return (
      <PortalPage className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </PortalPage>
    )
  }

  if (allowedTabs.length === 0) {
    return (
      <PortalPage className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view careers or HR modules.</p>
      </PortalPage>
    )
  }

  return (
    <>
      <PortalPage className="space-y-6">
        <PortalWelcome
          eyebrow="Talent & Hiring"
          title="Careers hub"
          description="Publish roles, review applicants, and manage HR operations. Employees use /employee for leave, attendance, and documents."
          aside={(
            <Button asChild variant="outline" className="rounded-xl gap-2 shrink-0">
              <Link to="/careers" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View public page
              </Link>
            </Button>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {canViewCareers ? (
            <>
              <StatCard title="Open positions" value={stats.openings} icon={Briefcase} gradient="blue" />
              <StatCard title="Published live" value={stats.published} icon={Building2} gradient="teal" />
            </>
          ) : null}
          {canViewApplications ? (
            <>
              <StatCard title="Total applications" value={stats.applications} icon={Users} gradient="purple" />
              <StatCard
                title="New applications"
                value={stats.newApplications}
                description="Awaiting review"
                icon={Inbox}
                gradient="green"
              />
            </>
          ) : null}
        </div>

        <PageHeader
          title="Manage careers"
          description={
            isHrPortal
              ? 'Switch between job openings, applications, and HR operations.'
              : 'Job openings and HR operations. Company roles and permissions are under Access Control in the sidebar.'
          }
          className="mb-0"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <AdminTabsList>
            {allowedTabs.includes('openings') ? (
              <AdminTabsTrigger value="openings" icon={Briefcase}>
                Job openings
                <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0 text-[10px]">
                  {stats.openings}
                </Badge>
              </AdminTabsTrigger>
            ) : null}
            {allowedTabs.includes('applications') ? (
              <AdminTabsTrigger value="applications" icon={UserRound}>
                Applications
                {stats.newApplications > 0 && (
                  <Badge className="ml-2 rounded-full px-2 py-0 text-[10px]">
                    {stats.newApplications} new
                  </Badge>
                )}
              </AdminTabsTrigger>
            ) : null}
            {allowedTabs.includes('employees') ? (
              <AdminTabsTrigger value="employees" icon={Users}>
                Employees
              </AdminTabsTrigger>
            ) : null}
            {allowedTabs.includes('leave') ? (
              <AdminTabsTrigger value="leave" icon={CalendarDays}>
                Leave requests
              </AdminTabsTrigger>
            ) : null}
            {allowedTabs.includes('attendance') ? (
              <AdminTabsTrigger value="attendance" icon={ClipboardList}>
                Attendance
              </AdminTabsTrigger>
            ) : null}
            {allowedTabs.includes('roles') ? (
              <AdminTabsTrigger value="roles" icon={BadgeCheck}>
                Company roles
              </AdminTabsTrigger>
            ) : null}
          </AdminTabsList>

          {allowedTabs.includes('openings') ? (
          <TabsContent value="openings" className="mt-0">
            <PortalPanel>
              <AdminPanelHeader
                icon={Briefcase}
                title="Job openings"
                description="Roles displayed on the public careers page."
                action={canManageCareers ? (
                  <Button
                    onClick={() => { setEditTarget(null); setFormOpen(true) }}
                    className="gap-2 rounded-xl glow-btn"
                  >
                    <Plus className="h-4 w-4" />
                    New opening
                  </Button>
                ) : undefined}
              />
              <div className="p-4 sm:p-6">
                {error ? (
                  <p className="text-sm text-destructive py-8 text-center" role="alert">{error}</p>
                ) : (
                  <DataTable
                    embedded
                    searchKeys={['title', 'department', 'location', 'employment_label']}
                    searchPlaceholder="Search openings..."
                    filters={[
                      {
                        key: 'publish_status',
                        label: 'Status',
                        options: [
                          { value: 'all', label: 'All statuses' },
                          { value: 'published', label: 'Published' },
                          { value: 'draft', label: 'Draft' },
                        ],
                      },
                    ]}
                    pageSize={6}
                    data={items}
                    emptyTitle="No job openings yet"
                    emptyDescription="Create your first role to start receiving applications."
                    columns={[
                      { key: 'title', header: 'Role', className: 'font-medium min-w-[180px]' },
                      { key: 'department', header: 'Department', render: (row) => row.department || '—' },
                      { key: 'company_role_name', header: 'Company role', render: (row) => row.company_role_name || '—' },
                      { key: 'location', header: 'Location', render: (row) => row.location || '—' },
                      { key: 'employment_label', header: 'Type', render: (row) => <Badge variant="outline">{row.employment_label}</Badge> },
                      { key: 'publish_status', header: 'Status', render: (row) => (
                        <Badge variant={row.is_published ? 'default' : 'secondary'}>
                          {row.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      ) },
                      { key: 'published_at', header: 'Published', render: (row) => formatDate(row.published_at) },
                      { key: 'actions', header: '', className: 'w-[120px] text-right', render: (row) => (
                        <TableActions actions={[
                          actionBtn('View opening', Eye, () => setDetail(row)),
                          ...(canManageCareers ? [
                            actionBtn('Edit opening', Pencil, () => { setEditTarget(row); setFormOpen(true) }),
                            { ...actionBtn('Delete opening', Trash2, () => setDeleteTarget(row)), variant: 'destructive' as const },
                          ] : []),
                        ]} />
                      ) },
                    ]}
                  />
                )}
              </div>
            </PortalPanel>
          </TabsContent>
          ) : null}

          {allowedTabs.includes('applications') ? (
          <TabsContent value="applications" className="mt-0">
            <PortalPanel>
              <AdminPanelHeader
                icon={Inbox}
                title="Job applications"
                description="Candidates who applied through the public careers page."
                action={canExportApplications ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => void handleExport('csv')}>Export CSV</Button>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => void handleExport('pdf')}>Export PDF</Button>
                  </div>
                ) : undefined}
              />
              <div className="p-4 sm:p-6">
                {appsLoading ? (
                  <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
                ) : appsError ? (
                  <p className="text-sm text-destructive py-8 text-center" role="alert">{appsError}</p>
                ) : (
                  <DataTable
                    embedded
                    searchKeys={['name', 'email', 'job_title', 'phone', 'status']}
                    searchPlaceholder="Search applications..."
                    filters={[
                      {
                        key: 'status',
                        label: 'Status',
                        options: [
                          { value: 'all', label: 'All statuses' },
                          ...STATUS_OPTIONS.map((status) => ({
                            value: status.value,
                            label: status.label,
                          })),
                        ],
                      },
                    ]}
                    pageSize={10}
                    data={applications}
                    emptyTitle="No applications yet"
                    emptyDescription="Applications submitted from the careers page will appear here."
                    columns={[
                      { key: 'name', header: 'Candidate', className: 'font-medium min-w-[140px]' },
                      { key: 'job_title', header: 'Position', className: 'min-w-[140px]' },
                      { key: 'email', header: 'Email' },
                      { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
                      { key: 'status', header: 'Status', render: (row) => (
                        <Badge variant={statusBadgeVariant(row.status)} className="capitalize">{row.status}</Badge>
                      ) },
                      { key: 'documents', header: 'Docs', render: (row) => row.documents?.length ?? 0 },
                      { key: 'created_at', header: 'Applied', render: (row) => formatDate(row.created_at) },
                      { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (row) => (
                        <TableActions actions={[
                          actionBtn('View application', Eye, () => {
                            setAppDetail(row)
                            setHrRemarks(row.hr_remarks ?? '')
                            setPortalLoginEmail('')
                            setConvertCompanyRoleId(row.career_default_company_role_id ?? '')
                          }),
                          ...(canManageApplications ? [
                            { ...actionBtn('Delete application', Trash2, () => setAppDeleteTarget(row)), variant: 'destructive' as const },
                          ] : []),
                        ]} />
                      ) },
                    ]}
                  />
                )}
              </div>
            </PortalPanel>
          </TabsContent>
          ) : null}

          {allowedTabs.includes('employees') ? (
          <TabsContent value="employees" className="mt-0">
            <HrEmployeesPanel />
          </TabsContent>
          ) : null}

          {allowedTabs.includes('leave') ? (
          <TabsContent value="leave" className="mt-0">
            <HrLeaveRequestsPanel />
          </TabsContent>
          ) : null}

          {allowedTabs.includes('attendance') ? (
          <TabsContent value="attendance" className="mt-0">
            <HrAttendanceRequestsPanel />
          </TabsContent>
          ) : null}

          {allowedTabs.includes('roles') ? (
            <TabsContent value="roles" className="mt-0">
              <CompanyRolesPanel />
            </TabsContent>
          ) : null}
        </Tabs>
      </PortalPage>

      <CareerFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTarget(null) }}
        initial={editTarget}
        saving={saving}
        onSubmit={handleSave}
      />

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Career opening">
        {detail && (
          <>
            <DetailRow label="Title" value={detail.title} />
            <DetailRow label="Department" value={detail.department || '—'} />
            <DetailRow label="Default company role" value={detail.company_role_name || '—'} />
            <DetailRow label="Location" value={detail.location || '—'} />
            <DetailRow label="Type" value={detail.employment_label} />
            <DetailRow label="Status" value={detail.is_published ? 'Published' : 'Draft'} />
            <DetailRow label="Published" value={formatDate(detail.published_at)} />
            <DetailRow label="Summary" value={detail.excerpt || '—'} />
            {detail.slug && (
              <DetailRow
                label="Public URL"
                value={(
                  <Link to={`/careers/${detail.slug}`} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] font-semibold hover:underline">
                    /careers/{detail.slug}
                  </Link>
                )}
              />
            )}
          </>
        )}
      </DetailDialog>

      <DetailDialog open={Boolean(appDetail)} onOpenChange={(open) => {
        if (!open) {
          setAppDetail(null)
          setPortalLoginEmail('')
          setConvertCompanyRoleId('')
        }
      }} title="Job application">
        {appDetail && (
          <>
            <DetailRow label="Candidate" value={appDetail.name} />
            <DetailRow label="Position" value={appDetail.job_title} />
            {appDetail.career_default_company_role_name ? (
              <DetailRow label="Default company role" value={appDetail.career_default_company_role_name} />
            ) : null}
            <DetailRow label="Email" value={appDetail.email} />
            <DetailRow label="Phone" value={appDetail.phone || '—'} />
            <DetailRow label="Applied" value={formatDate(appDetail.created_at)} />
            <DetailRow label="Qualification" value={appDetail.qualification || '—'} />
            <DetailRow label="Experience" value={appDetail.total_experience || '—'} />
            <DetailRow label="Expected salary" value={appDetail.expected_salary ? `₹${appDetail.expected_salary}` : '—'} />
            <DetailRow label="Cover note" value={appDetail.message || '—'} />
            {appDetail.documents.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
                {appDetail.documents.map((doc) => (
                  <button key={doc.id} type="button" className="text-sm text-[var(--brand-blue)] font-semibold hover:underline block" onClick={() => void handleDownloadDoc(appDetail.id, doc.id)}>
                    Download {doc.original_name} ({getApplicationDocumentLabel(doc.document_type)})
                  </button>
                ))}
              </div>
            ) : appDetail.resume_path ? (
              <DetailRow label="Resume" value="Available in secure storage — re-open after refresh" />
            ) : (
              <DetailRow label="Resume" value="—" />
            )}
            {canManageApplications ? (
              <div className="space-y-2 pt-2">
                <Label htmlFor="hr-remarks">HR remarks</Label>
                <textarea
                  id="hr-remarks"
                  rows={3}
                  value={hrRemarks || appDetail.hr_remarks || ''}
                  onChange={(e) => setHrRemarks(e.target.value)}
                  className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
              </div>
            ) : appDetail.hr_remarks ? (
              <DetailRow label="HR remarks" value={appDetail.hr_remarks} />
            ) : null}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Hiring status</p>
              {canManageApplications ? (
                <ApplicationStatusPills
                  current={appDetail.status}
                  disabled={statusUpdating}
                  onSelect={(status) => void handleStatusChange(appDetail, status)}
                />
              ) : (
                <Badge variant={statusBadgeVariant(appDetail.status)} className="capitalize">{appDetail.status}</Badge>
              )}
            </div>
            {canManageEmployees && appDetail.status === 'selected' && !appDetail.employee_id && (
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="convert-company-role">Company role</Label>
                  <select
                    id="convert-company-role"
                    value={convertCompanyRoleId}
                    onChange={(e) => setConvertCompanyRoleId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                  >
                    <option value="">Select role (optional)</option>
                    {companyRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-login-email">Portal login email</Label>
                  <Input
                    id="portal-login-email"
                    type="email"
                    value={portalLoginEmail}
                    onChange={(e) => setPortalLoginEmail(e.target.value)}
                    placeholder={appDetail.email}
                    className="h-11 rounded-xl"
                    autoComplete="off"
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Use candidate email ({appDetail.email}) or a different address if that email is already used for Admin/Client login. Login details are emailed to this address.
                  </p>
                </div>
                <Button type="button" className="rounded-xl" onClick={() => void handleConvertEmployee(appDetail)}>
                  Create employee profile
                </Button>
              </div>
            )}
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete opening?"
        description={`Remove "${deleteTarget?.title ?? 'this opening'}" permanently?`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(appDeleteTarget)}
        onOpenChange={(open) => !open && setAppDeleteTarget(null)}
        title="Delete application?"
        description={`Remove application from "${appDeleteTarget?.name ?? 'this candidate'}"?`}
        confirmLabel="Delete"
        loading={appDeleting}
        onConfirm={handleAppDelete}
      />
    </>
  )
}
