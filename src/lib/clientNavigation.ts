import type { ComponentType } from 'react'
import {
  LayoutDashboard, UserRound, ShoppingCart, CreditCard, KeyRound, FileText, Bell, LifeBuoy,
  Shield,
} from 'lucide-react'

export interface ClientNavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type ClientNavGroupDef = { id: string; label: string; paths: string[] }

export const clientNav: ClientNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
  { to: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/dashboard/licenses', label: 'Licenses', icon: KeyRound },
  { to: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { to: '/dashboard/change-password', label: 'Change Password', icon: KeyRound },
  { to: '/dashboard/security', label: 'Security', icon: Shield },
]

export const clientNavGroups: ClientNavGroupDef[] = [
  { id: 'dashboard', label: 'Dashboard', paths: ['/dashboard'] },
  { id: 'account', label: 'My Account', paths: ['/dashboard/profile', '/dashboard/orders', '/dashboard/subscriptions', '/dashboard/licenses', '/dashboard/invoices', '/dashboard/change-password', '/dashboard/security'] },
  { id: 'support', label: 'Support', paths: ['/dashboard/notifications', '/dashboard/support'] },
]
