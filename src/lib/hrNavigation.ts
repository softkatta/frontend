import type { ComponentType } from 'react'
import {
  LayoutDashboard, Bell, Briefcase, Inbox, Users, CalendarDays, ClipboardList,
  BadgeCheck, UserCog, UserRound, KeyRound, Shield, MenuSquare, Megaphone, Laptop, GraduationCap, TrendingUp, LifeBuoy,
} from 'lucide-react'

export interface HrNavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type HrNavGroupDef = { id: string; label: string; paths: string[] }

/** HR portal sidebar — maps to CareersManagement tabs and account pages */
export const hrNav: HrNavItem[] = [
  { to: '/hr', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hr/users', label: 'Users', icon: UserCog },
  { to: '/hr/openings', label: 'Job Openings', icon: Briefcase },
  { to: '/hr/applications', label: 'Applications', icon: Inbox },
  { to: '/hr/employees', label: 'Employees', icon: Users },
  { to: '/hr/leave', label: 'Leave Requests', icon: CalendarDays },
  { to: '/hr/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/hr/company-roles', label: 'Company Roles', icon: BadgeCheck },
  { to: '/hr/portal-menus', label: 'Portal Menus', icon: MenuSquare },
  { to: '/hr/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/hr/assets', label: 'Assets', icon: Laptop },
  { to: '/hr/training', label: 'Training', icon: GraduationCap },
  { to: '/hr/performance', label: 'Performance', icon: TrendingUp },
  { to: '/hr/helpdesk', label: 'Help Desk', icon: LifeBuoy },
  { to: '/hr/notifications', label: 'Notifications', icon: Bell },
  { to: '/hr/profile', label: 'My Profile', icon: UserRound },
  { to: '/hr/change-password', label: 'Change Password', icon: KeyRound },
  { to: '/hr/security', label: 'Security', icon: Shield },
]

export const hrNavGroups: HrNavGroupDef[] = [
  { id: 'dashboard', label: 'Dashboard', paths: ['/hr'] },
  { id: 'people', label: 'People', paths: ['/hr/users', '/hr/employees', '/hr/company-roles', '/hr/portal-menus'] },
  { id: 'hiring', label: 'Hiring', paths: ['/hr/openings', '/hr/applications'] },
  { id: 'operations', label: 'HR Operations', paths: ['/hr/leave', '/hr/attendance', '/hr/announcements', '/hr/assets', '/hr/training', '/hr/performance', '/hr/helpdesk'] },
  { id: 'account', label: 'My Account', paths: ['/hr/profile', '/hr/change-password', '/hr/security'] },
  { id: 'support', label: 'Support', paths: ['/hr/notifications'] },
]

/** Path → CareersManagement tab id */
export const HR_CAREERS_TAB_BY_PATH: Record<string, string> = {
  '/hr/openings': 'openings',
  '/hr/applications': 'applications',
  '/hr/employees': 'employees',
  '/hr/leave': 'leave',
  '/hr/attendance': 'attendance',
  '/hr/company-roles': 'roles',
  '/hr/careers': 'openings',
}

const hrExtraLabels: Record<string, string> = {
  '/hr/careers': 'Careers Hub',
}

export function getHrBreadcrumbLabel(pathname: string): string | undefined {
  const item = hrNav.find((entry) => entry.to === pathname)
  if (item) return item.label
  return hrExtraLabels[pathname]
}
