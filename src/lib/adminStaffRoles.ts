/** Company role slugs shown on Admin → Users (internal team only). */
export const ADMIN_STAFF_COMPANY_ROLE_SLUGS = [
  'receptionist',
  'software-developer',
  'ui-ux-designer',
] as const

export type AdminStaffCompanyRoleSlug = (typeof ADMIN_STAFF_COMPANY_ROLE_SLUGS)[number]

export const ADMIN_STAFF_ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All team roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hr_manager', label: 'HR' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'software-developer', label: 'Developer' },
  { value: 'ui-ux-designer', label: 'Designer' },
] as const

export function isAdminStaffCompanyRoleSlug(value: string): value is AdminStaffCompanyRoleSlug {
  return (ADMIN_STAFF_COMPANY_ROLE_SLUGS as readonly string[]).includes(value)
}

export function filterStaffCompanyRoles<T extends { slug?: string }>(roles: T[]): T[] {
  return roles.filter((role) => role.slug && isAdminStaffCompanyRoleSlug(role.slug))
}
