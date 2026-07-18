import { useCallback, useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2, UserX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CustomerFormDialog, type CustomerFormValues } from '@/components/admin/CustomerFormDialog'
import { EmployeeFormDialog, type EmployeeFormValues } from '@/components/admin/EmployeeFormDialog'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList, unwrapPaginated, asRecord } from '@/lib/apiHelpers'
import { mapAdminUser } from '@/lib/apiMappers'
import { ADMIN_STAFF_ROLE_FILTER_OPTIONS, filterStaffCompanyRoles } from '@/lib/adminStaffRoles'
import { userAvatarUrl } from '@/lib/mediaUrl'
import { toast } from '@/components/ui/toaster'

type UserRow = ReturnType<typeof mapAdminUser>

type UsersPageProps = {
  mode?: 'admin' | 'hr'
  variant?: 'staff' | 'customers'
}

function roleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' | 'success' {
  if (role === 'super_admin') return 'default'
  if (role === 'hr_manager') return 'secondary'
  if (role === 'client') return 'success'
  return 'outline'
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return (parts[0]?.[0] ?? 'U').toUpperCase()
}

function UserAvatarCell({ name, avatar }: { name: string; avatar?: string }) {
  return (
    <Avatar className="h-9 w-9 shrink-0 border border-[var(--border)]">
      <AvatarImage src={userAvatarUrl(avatar, name)} alt={name} />
      <AvatarFallback className="text-xs font-semibold">{userInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

export default function UsersPage({ mode = 'admin', variant = 'staff' }: UsersPageProps) {
  const readOnly = mode === 'hr'
  const isCustomersView = !readOnly && variant === 'customers'
  const isStaffView = !readOnly && variant === 'staff'
  const [items, setItems] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: 'all',
    is_active: 'all',
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = filterValues.role
      const status = filterValues.is_active
      const response = await adminApi.users.list(
        isCustomersView
          ? {
              customers_only: true,
              page,
              per_page: pageSize,
              ...(debouncedSearch ? { search: debouncedSearch } : {}),
              ...(status && status !== 'all' ? { is_active: status } : {}),
            }
          : isStaffView
            ? {
                staff_directory: true,
                page,
                per_page: pageSize,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(role && role !== 'all' ? { staff_role: role } : {}),
                ...(status && status !== 'all' ? { is_active: status } : {}),
              }
            : {
                all: true,
                page,
                per_page: pageSize,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(role && role !== 'all' ? { role } : {}),
                ...(status && status !== 'all' ? { is_active: status } : {}),
              },
      )
      const { items: rows, meta } = unwrapPaginated<unknown>(response)
      setItems(rows.map(mapAdminUser))
      setTotal(meta.total)
      setTotalPages(meta.last_page)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setItems([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, filterValues.role, filterValues.is_active, isCustomersView, isStaffView])

  useEffect(() => {
    void reload()
  }, [reload])

  const [detail, setDetail] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hrDialogOpen, setHrDialogOpen] = useState(false)
  const [hrSaving, setHrSaving] = useState(false)
  const [hrForm, setHrForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [customerCreating, setCustomerCreating] = useState(false)
  const [customerEditing, setCustomerEditing] = useState<UserRow | null>(null)
  const [customerSaving, setCustomerSaving] = useState(false)
  const [employeeCreating, setEmployeeCreating] = useState(false)
  const [employeeEditing, setEmployeeEditing] = useState<UserRow | null>(null)
  const [employeeSaving, setEmployeeSaving] = useState(false)
  const [companyRoles, setCompanyRoles] = useState<Array<{ id: string; name: string; category: string; slug?: string }>>([])

  const loadCompanyRoles = useCallback(async () => {
    try {
      const rows = unwrapList(await adminApi.companyRoles.list({ active_only: true }))
      setCompanyRoles(filterStaffCompanyRoles(rows.map((item) => {
        const row = asRecord(item)
        return {
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
          category: String(row.category ?? 'Other'),
          slug: String(row.slug ?? ''),
        }
      })))
    } catch {
      setCompanyRoles([])
    }
  }, [])

  useEffect(() => {
    if (employeeCreating || employeeEditing) {
      void loadCompanyRoles()
    }
  }, [employeeCreating, employeeEditing, loadCompanyRoles])

  const toggleActive = async (user: UserRow) => {
    try {
      await adminApi.users.update(user.id, { is_active: !user.is_active })
      toast({ title: user.is_active ? 'User deactivated' : 'User activated', variant: 'success' })
      await reload()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.users.delete(deleteTarget.id)
      toast({ title: 'User deleted', description: deleteTarget.name, variant: 'success' })
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) setDetail(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateHr = async (event: React.FormEvent) => {
    event.preventDefault()
    setHrSaving(true)
    try {
      await adminApi.hrManagers.create({
        name: hrForm.name.trim(),
        email: hrForm.email.trim().toLowerCase(),
        password: hrForm.password,
        ...(hrForm.phone.trim() ? { phone: hrForm.phone.trim() } : {}),
      })
      toast({ title: 'HR manager created', description: 'They can sign in at /hr', variant: 'success' })
      setHrDialogOpen(false)
      setHrForm({ name: '', email: '', password: '', phone: '' })
      await reload()
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setHrSaving(false)
    }
  }

  const handleCreateCustomer = async (values: CustomerFormValues) => {
    setCustomerSaving(true)
    try {
      await adminApi.users.create({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || null,
        company_name: values.company_name || null,
        is_active: values.is_active,
      })
      toast({ title: 'Customer created', description: values.name, variant: 'success' })
      setCustomerCreating(false)
      await reload()
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setCustomerSaving(false)
    }
  }

  const handleSaveCustomer = async (values: CustomerFormValues) => {
    if (!customerEditing) return
    setCustomerSaving(true)
    try {
      await adminApi.users.update(customerEditing.id, {
        name: values.name,
        email: values.email,
        company_name: values.company_name || null,
        is_active: values.is_active,
      })
      toast({ title: 'Customer updated', description: values.name, variant: 'success' })
      setCustomerEditing(null)
      await reload()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setCustomerSaving(false)
    }
  }

  const handleCreateEmployee = async (values: EmployeeFormValues) => {
    setEmployeeSaving(true)
    try {
      const res = asRecord(await adminApi.employees.create({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.department.trim() ? { department: values.department.trim() } : {}),
        ...(values.designation.trim() ? { designation: values.designation.trim() } : {}),
        ...(values.company_role_id ? { company_role_id: Number(values.company_role_id) } : {}),
        ...(values.portal_email.trim() ? { portal_email: values.portal_email.trim().toLowerCase() } : {}),
      }))
      const portal = asRecord(res.portal_login)

      if (portal.skipped === true) {
        toast({
          title: 'Employee created — portal login not created',
          description: String(portal.reason ?? 'Use a different portal email and create access from Careers.'),
          variant: 'destructive',
        })
      } else {
        const tempPassword = portal.temporary_password as string | null | undefined
        const emailed = Boolean(portal.credentials_emailed)
        toast({
          title: 'Employee created',
          description: emailed
            ? `Login details emailed to ${portal.email}.`
            : tempPassword
              ? `Share manually: ${portal.email} / ${tempPassword} at /employee`
              : `Employee can login at /employee with ${portal.email}`,
          variant: emailed || !tempPassword ? 'success' : 'destructive',
        })
      }

      setEmployeeCreating(false)
      await reload()
    } catch (err) {
      toast({ title: 'Create failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setEmployeeSaving(false)
    }
  }

  const handleSaveEmployee = async (values: EmployeeFormValues) => {
    if (!employeeEditing) return
    setEmployeeSaving(true)
    try {
      await adminApi.users.update(employeeEditing.id, {
        name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
        is_active: values.is_active,
      })

      if (employeeEditing.employee_id) {
        await adminApi.employees.update(employeeEditing.employee_id, {
          full_name: values.full_name.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim() || null,
          department: values.department.trim() || null,
          designation: values.designation.trim() || null,
          company_role_id: values.company_role_id ? Number(values.company_role_id) : null,
        })
      }

      toast({ title: 'Employee updated', description: values.full_name, variant: 'success' })
      setEmployeeEditing(null)
      await reload()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setEmployeeSaving(false)
    }
  }

  const canDelete = (user: UserRow) => user.role !== 'super_admin'

  const deleteDescription = (user: UserRow) => {
    if (user.role === 'client') {
      return `This will permanently remove ${user.name} and their orders, subscriptions, and invoices.`
    }
    if (user.role === 'employee') {
      return `This will permanently remove ${user.name}, their HR profile, documents, and portal access.`
    }
    return `Remove ${user.name} (${user.role_label})? This cannot be undone.`
  }

  return (
    <>
      <PortalPageShell
        eyebrow={readOnly ? 'HR' : isCustomersView ? 'CRM' : 'Platform'}
        heroTitle={isCustomersView ? 'Customers' : 'Users'}
        heroDescription={
          readOnly
            ? 'View staff and HR manager accounts — read-only directory for your team.'
            : isCustomersView
              ? 'Manage client accounts — product buyers, subscriptions, and support tickets.'
              : 'Internal SoftKatta team — Super Admin, HR, Receptionist, Developer, and Designer.'
        }
        title={readOnly ? 'Staff directory' : isCustomersView ? 'All customers' : 'Team members'}
        description={
          readOnly
            ? 'HR managers and employees'
            : isCustomersView
              ? 'Client portal accounts'
              : 'Super Admin, HR, Receptionist, Developer, Designer'
        }
        actions={readOnly ? (
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/hr/careers">HR operations</Link>
          </Button>
        ) : isCustomersView ? (
          <Button onClick={() => setCustomerCreating(true)} className="gap-2 rounded-xl glow-btn">
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/careers">HR operations</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/admin/customers">Customers</Link>
            </Button>
            <Button onClick={() => setEmployeeCreating(true)} variant="outline" className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add team member
            </Button>
            <Button onClick={() => setHrDialogOpen(true)} className="gap-2 rounded-xl glow-btn">
              <Plus className="h-4 w-4" />
              Add HR
            </Button>
          </div>
        )}
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['name']}
          searchPlaceholder={isCustomersView ? 'Search customers...' : 'Search users...'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterValues={filterValues}
          onFilterChange={(key, value) => {
            setFilterValues((prev) => ({ ...prev, [key]: value }))
            setPage(1)
          }}
          onClearFilters={() => {
            setSearchQuery('')
            setFilterValues({ role: 'all', is_active: 'all' })
            setPage(1)
          }}
          filters={
            isCustomersView
              ? [
                  {
                    key: 'is_active',
                    label: 'Status',
                    options: [
                      { value: 'all', label: 'All statuses' },
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ],
                  },
                ]
              : [
                  {
                    key: 'role',
                    label: 'Role',
                    options: readOnly
                      ? [
                          { value: 'all', label: 'All roles' },
                          { value: 'hr_manager', label: 'HR Manager' },
                          { value: 'employee', label: 'Staff (employee portal)' },
                        ]
                      : isStaffView
                        ? [...ADMIN_STAFF_ROLE_FILTER_OPTIONS]
                        : [
                            { value: 'all', label: 'All roles' },
                            { value: 'client', label: 'Customer' },
                            { value: 'super_admin', label: 'Super Admin' },
                            { value: 'hr_manager', label: 'HR Manager' },
                            { value: 'employee', label: 'Staff (employee portal)' },
                          ],
                  },
                  {
                    key: 'is_active',
                    label: 'Status',
                    options: [
                      { value: 'all', label: 'All statuses' },
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ],
                  },
                ]
          }
          pageSizeOptions={[10, 15, 25, 50]}
          serverPagination={{
            page,
            pageSize,
            total,
            totalPages,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(1)
            },
          }}
          data={items}
          emptyTitle={isCustomersView ? 'No customers yet' : 'No users yet'}
          emptyDescription={
            readOnly
              ? 'HR manager and employee accounts appear here when created.'
              : isCustomersView
                ? 'Customer accounts appear here when registered or added manually.'
                : 'Super Admin, HR, Receptionist, Developer, and Designer accounts appear here.'
          }
          columns={[
            {
              key: 'name',
              header: 'Name',
              className: 'font-medium min-w-[200px]',
              render: (row) => (
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatarCell name={row.name} avatar={row.avatar} />
                  <span className="truncate">{row.name}</span>
                </div>
              ),
            },
            { key: 'email', header: 'Email', className: 'min-w-[180px]' },
            {
              key: 'role_label',
              header: 'Role',
              render: (row) => (
                <div className="space-y-1">
                  <Badge variant={roleBadgeVariant(row.role)}>{row.role_label}</Badge>
                  {row.role === 'employee' && row.login_role_label !== row.role_label ? (
                    <p className="text-[10px] text-[var(--muted-foreground)]">{row.login_role_label} account</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'company',
              header: 'Company',
              render: (row) => row.company || '—',
            },
            ...(isCustomersView
              ? []
              : [
                  {
                    key: 'login_portal',
                    header: 'Login portal',
                    render: (row: UserRow) => (
                      row.login_portal !== '—'
                        ? (
                          <Link to={row.login_portal} className="text-[var(--brand-blue)] font-semibold hover:underline text-sm">
                            {row.login_portal}
                          </Link>
                        )
                        : '—'
                    ),
                  },
                  {
                    key: 'employee_code',
                    header: 'Employee ID',
                    render: (row: UserRow) => row.employee_code || '—',
                  },
                  {
                    key: 'designation',
                    header: 'Designation',
                    render: (row: UserRow) => row.designation || '—',
                  },
                ]),
            {
              key: 'is_active',
              header: 'Status',
              render: (row) => (
                <Badge variant={row.is_active ? 'success' : 'secondary'}>
                  {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              header: 'Created',
              render: (row) => formatDate(row.created_at),
            },
            {
              key: 'actions',
              header: '',
              className: 'w-[140px] text-right',
              render: (row) => (
                <TableActions actions={readOnly
                  ? [actionBtn('View user', Eye, () => setDetail(row))]
                  : isCustomersView
                    ? [
                        actionBtn('View customer', Eye, () => setDetail(row)),
                        actionBtn('Edit customer', Pencil, () => setCustomerEditing(row)),
                        actionBtn(row.is_active ? 'Deactivate' : 'Activate', UserX, () => void toggleActive(row)),
                        { ...actionBtn('Delete customer', Trash2, () => setDeleteTarget(row)), variant: 'destructive' as const },
                      ]
                    : [
                        actionBtn('View user', Eye, () => setDetail(row)),
                        ...(row.role === 'employee'
                          ? [actionBtn('Edit team member', Pencil, () => setEmployeeEditing(row))]
                          : []),
                        actionBtn(row.is_active ? 'Deactivate' : 'Activate', UserX, () => void toggleActive(row)),
                        ...(canDelete(row)
                          ? [{ ...actionBtn('Delete user', Trash2, () => setDeleteTarget(row)), variant: 'destructive' as const }]
                          : []),
                      ]} />
              ),
            },
          ]}
        />
      </PortalPageShell>

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="User details">
        {detail && (
          <>
            <div className="flex items-center gap-4 pb-4 mb-1 border-b border-[var(--border)]">
              <Avatar className="h-16 w-16 border border-[var(--border)]">
                <AvatarImage src={userAvatarUrl(detail.avatar, detail.name)} alt={detail.name} />
                <AvatarFallback className="text-lg font-semibold">{userInitials(detail.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-foreground truncate">{detail.name}</p>
                <p className="text-sm text-[var(--muted-foreground)] truncate">{detail.email}</p>
              </div>
            </div>
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Phone" value={detail.phone || '—'} />
            <DetailRow label="Company role" value={detail.role_label} />
            {detail.login_role_label && detail.login_role_label !== detail.role_label ? (
              <DetailRow label="Login role" value={detail.login_role_label} />
            ) : null}
            {detail.company ? <DetailRow label="Company" value={detail.company} /> : null}
            <DetailRow
              label="Login portal"
              value={detail.login_portal !== '—' ? (
                <Link to={detail.login_portal} className="text-[var(--brand-blue)] font-semibold hover:underline">
                  {detail.login_portal}
                </Link>
              ) : '—'}
            />
            {detail.employee_code ? <DetailRow label="Employee ID" value={detail.employee_code} /> : null}
            {detail.department ? <DetailRow label="Department" value={detail.department} /> : null}
            {detail.designation ? <DetailRow label="Designation" value={detail.designation} /> : null}
            {detail.login_details ? (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Login details</p>
                <DetailRow label="Portal" value={(
                  detail.login_details.portal_url !== '—'
                    ? (
                      <Link to={detail.login_details.portal_url} className="text-[var(--brand-blue)] font-semibold hover:underline">
                        {detail.login_details.portal_url}
                      </Link>
                    )
                    : '—'
                )} />
                <DetailRow label="Email" value={detail.login_details.email} />
                <DetailRow
                  label="Password"
                  value={detail.login_details.password || 'Not stored — reset or recreate account'}
                />
              </div>
            ) : null}
            <DetailRow label="Status" value={detail.is_active ? 'Active' : 'Inactive'} />
            <DetailRow label="Created" value={formatDate(detail.created_at)} />
            {detail.last_login_at ? <DetailRow label="Last login" value={formatDate(detail.last_login_at)} /> : null}
          </>
        )}
      </DetailDialog>

      {!readOnly && isCustomersView ? (
        <>
          <CustomerFormDialog
            open={customerCreating}
            mode="create"
            onOpenChange={(open) => !open && setCustomerCreating(false)}
            saving={customerSaving}
            onSubmit={handleCreateCustomer}
          />

          <CustomerFormDialog
            open={Boolean(customerEditing)}
            mode="edit"
            onOpenChange={(open) => !open && setCustomerEditing(null)}
            initial={customerEditing ? {
              name: customerEditing.name,
              email: customerEditing.email,
              phone: customerEditing.phone ?? '',
              company_name: customerEditing.company,
              is_active: customerEditing.is_active,
            } : null}
            saving={customerSaving}
            onSubmit={handleSaveCustomer}
          />

          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Delete customer?"
            description={deleteTarget ? deleteDescription(deleteTarget) : ''}
            confirmLabel="Delete"
            loading={deleting}
            onConfirm={handleDelete}
          />
        </>
      ) : null}

      {!readOnly && isStaffView ? (
        <>
          <EmployeeFormDialog
            open={employeeCreating}
            mode="create"
            onOpenChange={(open) => !open && setEmployeeCreating(false)}
            companyRoles={companyRoles}
            saving={employeeSaving}
            onSubmit={handleCreateEmployee}
          />

          <EmployeeFormDialog
            open={Boolean(employeeEditing)}
            mode="edit"
            onOpenChange={(open) => !open && setEmployeeEditing(null)}
            companyRoles={companyRoles}
            initial={employeeEditing ? {
              full_name: employeeEditing.name,
              email: employeeEditing.email,
              phone: employeeEditing.phone ?? '',
              department: employeeEditing.department ?? '',
              company_role_id: employeeEditing.company_role_id ?? '',
              designation: employeeEditing.designation ?? '',
              is_active: employeeEditing.is_active,
            } : null}
            saving={employeeSaving}
            onSubmit={handleSaveEmployee}
          />

          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title={
              deleteTarget?.role === 'employee'
                ? 'Delete team member?'
                : 'Delete user?'
            }
            description={deleteTarget ? deleteDescription(deleteTarget) : ''}
            confirmLabel="Delete"
            loading={deleting}
            onConfirm={handleDelete}
          />
        </>
      ) : null}

      {!readOnly && isStaffView ? (
        <Dialog open={hrDialogOpen} onOpenChange={setHrDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Add HR</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateHr} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="users-hr-name">Full name</Label>
                <Input id="users-hr-name" value={hrForm.name} onChange={(e) => setHrForm({ ...hrForm, name: e.target.value })} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users-hr-email">Email</Label>
                <Input id="users-hr-email" type="email" value={hrForm.email} onChange={(e) => setHrForm({ ...hrForm, email: e.target.value })} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users-hr-password">Password</Label>
                <Input id="users-hr-password" type="password" minLength={8} value={hrForm.password} onChange={(e) => setHrForm({ ...hrForm, password: e.target.value })} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users-hr-phone">Phone (optional)</Label>
                <Input id="users-hr-phone" digitsOnly maxDigits={10} maxLength={10} value={hrForm.phone} onChange={(e) => setHrForm({ ...hrForm, phone: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setHrDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl" disabled={hrSaving}>{hrSaving ? 'Creating…' : 'Create account'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
