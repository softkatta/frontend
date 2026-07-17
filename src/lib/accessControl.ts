import type { User } from '@/types'

/** Route path → required permission(s). Omit or null = no extra check beyond role. */
const PATH_PERMISSIONS: Record<string, string | string[]> = {
  // Employee portal
  '/employee': 'employee.dashboard.view',
  '/employee/profile': 'employee.profile.view',
  '/employee/leave': 'employee.leave.view',
  '/employee/attendance': 'employee.attendance.view',
  '/employee/documents': 'employee.documents.view',
  '/employee/resignation': 'employee.resignation.view',
  '/employee/tasks': 'employee.tasks.view',
  '/employee/projects': 'employee.projects.view',
  '/employee/timesheets': 'employee.timesheets.view',
  '/employee/calendar': 'employee.calendar.view',
  '/employee/announcements': 'employee.announcements.view',
  '/employee/assets': 'employee.assets.view',
  '/employee/training': 'employee.training.view',
  '/employee/performance': 'employee.performance.view',
  '/employee/helpdesk': 'employee.helpdesk.view',

  // Client portal
  '/dashboard': 'client.dashboard.view',
  '/dashboard/profile': 'client.profile.view',
  '/dashboard/orders': 'client.orders.view',
  '/dashboard/subscriptions': 'client.subscriptions.view',
  '/dashboard/licenses': 'client.licenses.view',
  '/dashboard/invoices': 'client.invoices.view',
  '/dashboard/support': 'client.support.view',

  // HR portal
  '/hr/users': 'hr.users.view',
  '/hr/careers': 'hr.careers.view',
  '/hr/openings': 'hr.careers.view',
  '/hr/applications': 'hr.applications.view',
  '/hr/employees': 'hr.employees.view',
  '/hr/leave': 'hr.leave.view',
  '/hr/attendance': 'hr.attendance.view',
  '/hr/company-roles': 'hr.company-roles.view',
  '/hr/portal-menus': 'hr.company-roles.view',
  '/hr/announcements': 'hr.announcements.view',
  '/hr/assets': 'hr.assets.view',
  '/hr/training': 'hr.training.view',
  '/hr/performance': 'hr.performance.view',
  '/hr/helpdesk': 'hr.helpdesk.view',

  // Admin — HR-related pages (Founder bypasses all checks)
  '/admin/roles': 'hr.company-roles.view',
  '/admin/permissions': 'hr.permissions.view',
  '/admin/portal-menus': 'hr.company-roles.view',
  '/admin/careers': 'hr.careers.view',
  '/admin/announcements': 'hr.announcements.view',
  '/admin/assets': 'hr.assets.view',
  '/admin/training': 'hr.training.view',
  '/admin/performance': 'hr.performance.view',
  '/admin/helpdesk': 'hr.helpdesk.view',
}

/** Employee account routes always available regardless of company role menus. */
const EMPLOYEE_ALWAYS_ALLOWED = [
  '/employee/change-password',
  '/employee/security',
]

/** HR account routes always available for HR managers. */
const HR_ALWAYS_ALLOWED = [
  '/hr/profile',
  '/hr/change-password',
  '/hr/security',
  '/hr/notifications',
]

/** Client account routes always available for clients. */
const CLIENT_ALWAYS_ALLOWED = [
  '/dashboard/change-password',
  '/dashboard/security',
  '/dashboard/notifications',
]

function normalizePath(path: string): string {
  const base = path.split('?')[0].replace(/\/+$/, '') || '/'
  return base
}

function isPathAllowed(path: string, allowedPaths: string[]): boolean {
  const normalized = normalizePath(path)

  for (const allowed of allowedPaths) {
    if (normalized === allowed) {
      return true
    }

    if (allowed !== '/employee' && normalized.startsWith(`${allowed}/`)) {
      return true
    }
  }

  return false
}

function resolvePathPermission(path: string): string | string[] | null {
  const normalized = normalizePath(path)

  if (PATH_PERMISSIONS[normalized]) {
    return PATH_PERMISSIONS[normalized]
  }

  for (const [routePath, permission] of Object.entries(PATH_PERMISSIONS)) {
    if (routePath !== '/' && normalized.startsWith(`${routePath}/`)) {
      return permission
    }
  }

  return null
}

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.permissions?.includes(permission) ?? false
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function canAccessPath(user: User | null | undefined, path: string): boolean {
  const required = resolvePathPermission(path)
  if (required) {
    const permissionOk = Array.isArray(required)
      ? hasAnyPermission(user, required)
      : hasPermission(user, required)
    if (!permissionOk) return false
  }

  if (user?.role === 'employee') {
    const normalized = normalizePath(path)
    if (EMPLOYEE_ALWAYS_ALLOWED.some((allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`))) {
      return true
    }

    const portalPaths = user.employee_portal_paths
    // Missing/empty paths = allow all permission-gated pages (full default catalog).
    if (!portalPaths?.length) {
      return true
    }

    return isPathAllowed(path, portalPaths)
  }

  if (user?.role === 'hr') {
    const normalized = normalizePath(path)
    if (HR_ALWAYS_ALLOWED.some((allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`))) {
      return true
    }
  }

  if (user?.role === 'client') {
    const normalized = normalizePath(path)
    if (CLIENT_ALWAYS_ALLOWED.some((allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`))) {
      return true
    }
  }

  return true
}

export function filterAccessiblePaths(user: User | null | undefined, paths: string[]): string[] {
  return paths.filter((path) => canAccessPath(user, path))
}
