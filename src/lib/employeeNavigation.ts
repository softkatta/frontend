import type { ComponentType } from 'react'
import {
  LayoutDashboard, UserRound, CalendarDays, ClipboardList, FileText, LogOut, Bell,
  KeyRound, Shield, ListTodo, FolderKanban, Clock, Calendar, Megaphone, Laptop,
  GraduationCap, TrendingUp, LifeBuoy,
} from 'lucide-react'

export interface EmployeeNavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type EmployeeNavGroupDef = { id: string; label: string; paths: string[] }

export const employeeNav: EmployeeNavItem[] = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/profile', label: 'My profile', icon: UserRound },
  { to: '/employee/leave', label: 'Leave application', icon: CalendarDays },
  { to: '/employee/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/employee/documents', label: 'Documents', icon: FileText },
  { to: '/employee/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/employee/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/employee/timesheets', label: 'Timesheets', icon: Clock },
  { to: '/employee/calendar', label: 'Calendar', icon: Calendar },
  { to: '/employee/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/employee/assets', label: 'Assets', icon: Laptop },
  { to: '/employee/training', label: 'Training', icon: GraduationCap },
  { to: '/employee/performance', label: 'Performance Reviews', icon: TrendingUp },
  { to: '/employee/helpdesk', label: 'Help Desk', icon: LifeBuoy },
  { to: '/employee/resignation', label: 'Resignation', icon: LogOut },
  { to: '/employee/notifications', label: 'Notifications', icon: Bell },
  { to: '/employee/change-password', label: 'Change Password', icon: KeyRound },
  { to: '/employee/security', label: 'Security', icon: Shield },
]

export const employeeNavGroups: EmployeeNavGroupDef[] = [
  { id: 'dashboard', label: 'Dashboard', paths: ['/employee'] },
  {
    id: 'hr',
    label: 'HR self-service',
    paths: ['/employee/profile', '/employee/leave', '/employee/attendance', '/employee/documents', '/employee/resignation'],
  },
  {
    id: 'work',
    label: 'Work',
    paths: [
      '/employee/tasks',
      '/employee/projects',
      '/employee/timesheets',
      '/employee/calendar',
      '/employee/announcements',
      '/employee/assets',
      '/employee/training',
      '/employee/performance',
      '/employee/helpdesk',
    ],
  },
  { id: 'account', label: 'My Account', paths: ['/employee/change-password', '/employee/security'] },
  { id: 'support', label: 'Support', paths: ['/employee/notifications'] },
]
