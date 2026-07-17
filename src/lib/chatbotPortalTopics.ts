import type { UserRole } from '@/types'

export type PortalTopicIcon =
  | 'attendance'
  | 'tasks'
  | 'leave'
  | 'documents'
  | 'timesheets'
  | 'helpdesk'
  | 'orders'
  | 'subscriptions'
  | 'invoices'
  | 'licenses'
  | 'support'
  | 'users'
  | 'products'
  | 'notifications'
  | 'employees'
  | 'applications'
  | 'portal_help'

export interface PortalTopic {
  key: string
  label: string
  icon: PortalTopicIcon
}

const EMPLOYEE_TOPICS: PortalTopic[] = [
  { key: 'portal:employee:attendance', label: 'Attendance', icon: 'attendance' },
  { key: 'portal:employee:tasks', label: 'My Tasks', icon: 'tasks' },
  { key: 'portal:employee:leave', label: 'Leave', icon: 'leave' },
  { key: 'portal:employee:timesheets', label: 'Timesheets', icon: 'timesheets' },
  { key: 'portal:employee:documents', label: 'Documents', icon: 'documents' },
  { key: 'portal:employee:helpdesk', label: 'Help Desk', icon: 'helpdesk' },
  { key: 'portal:employee:help', label: 'All portal help', icon: 'portal_help' },
]

const CLIENT_TOPICS: PortalTopic[] = [
  { key: 'portal:client:orders', label: 'Orders', icon: 'orders' },
  { key: 'portal:client:subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { key: 'portal:client:invoices', label: 'Invoices', icon: 'invoices' },
  { key: 'portal:client:licenses', label: 'Licenses', icon: 'licenses' },
  { key: 'portal:client:support', label: 'Support', icon: 'support' },
  { key: 'portal:client:help', label: 'All portal help', icon: 'portal_help' },
]

const ADMIN_TOPICS: PortalTopic[] = [
  { key: 'portal:admin:users', label: 'Users', icon: 'users' },
  { key: 'portal:admin:products', label: 'Products', icon: 'products' },
  { key: 'portal:admin:subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { key: 'portal:admin:orders', label: 'Orders', icon: 'orders' },
  { key: 'portal:admin:notifications', label: 'Broadcasts', icon: 'notifications' },
  { key: 'portal:admin:chatbot', label: 'Chatbot', icon: 'portal_help' },
  { key: 'portal:admin:help', label: 'All portal help', icon: 'portal_help' },
]

const HR_TOPICS: PortalTopic[] = [
  { key: 'portal:hr:employees', label: 'Employees', icon: 'employees' },
  { key: 'portal:hr:leave', label: 'Leave Requests', icon: 'leave' },
  { key: 'portal:hr:attendance', label: 'Attendance', icon: 'attendance' },
  { key: 'portal:hr:openings', label: 'Job Openings', icon: 'tasks' },
  { key: 'portal:hr:applications', label: 'Applications', icon: 'applications' },
  { key: 'portal:hr:help', label: 'All portal help', icon: 'portal_help' },
]

export function getPortalTopics(role?: UserRole | null): PortalTopic[] {
  switch (role) {
    case 'employee':
      return EMPLOYEE_TOPICS
    case 'client':
      return CLIENT_TOPICS
    case 'admin':
      return ADMIN_TOPICS
    case 'hr':
      return HR_TOPICS
    default:
      return []
  }
}

export function getPortalRoleLabel(role?: UserRole | null): string | null {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'employee':
      return 'Employee'
    case 'client':
      return 'Client'
    case 'hr':
      return 'HR'
    default:
      return null
  }
}
