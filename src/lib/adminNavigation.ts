import type { ComponentType } from 'react'
import {
  LayoutDashboard, Package, CreditCard, FileText, Bell, LifeBuoy,
  ShoppingCart, BarChart3, BookOpen, Settings, UserCog, BadgeCheck, Shield,
  FolderTree, Layers, Star, Building2, KeyRound, Plug, Wallet, Wrench, Briefcase, ImagePlus,
  Inbox, UserRound, MenuSquare, Megaphone, Laptop, GraduationCap, TrendingUp, Ticket, Bot, Users,
} from 'lucide-react'

export interface AdminNavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type AdminNavGroupDef = { id: string; label: string; paths: string[] }

/** Admin sidebar routes — single source for nav, breadcrumbs, and quick search */
export const adminNav: AdminNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/plans', label: 'Plans', icon: Layers },
  { to: '/admin/coupons', label: 'Coupons', icon: Star },
  { to: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: BadgeCheck },
  { to: '/admin/permissions', label: 'Permissions', icon: Shield },
  { to: '/admin/portal-menus', label: 'Portal Menus', icon: MenuSquare },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/licenses', label: 'License Keys', icon: KeyRound },
  { to: '/admin/product-integrations', label: 'Product Integrations', icon: Plug },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/notifications', label: 'Broadcasts', icon: Bell },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/assets', label: 'Assets', icon: Laptop },
  { to: '/admin/training', label: 'Training', icon: GraduationCap },
  { to: '/admin/performance', label: 'Performance', icon: TrendingUp },
  { to: '/admin/helpdesk', label: 'Help Desk', icon: LifeBuoy },
  { to: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { to: '/admin/support', label: 'Support Tickets', icon: Ticket },
  { to: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/careers', label: 'Careers', icon: Briefcase },
  { to: '/admin/site-content', label: 'Site Content', icon: ImagePlus },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/chatbot', label: 'Chatbot', icon: Bot },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/profile', label: 'My Profile', icon: UserRound },
  { to: '/admin/change-password', label: 'Change Password', icon: KeyRound },
  { to: '/admin/security', label: 'Security', icon: Shield },
]

export const adminNavGroups: AdminNavGroupDef[] = [
  { id: 'dashboard', label: 'Dashboard', paths: ['/admin'] },
  { id: 'catalog', label: 'Catalog', paths: ['/admin/products', '/admin/categories', '/admin/plans', '/admin/coupons', '/admin/product-integrations'] },
  { id: 'crm', label: 'CRM', paths: ['/admin/tenants', '/admin/users', '/admin/customers', '/admin/roles', '/admin/permissions', '/admin/portal-menus', '/admin/subscriptions', '/admin/licenses'] },
  { id: 'sales', label: 'Sales', paths: ['/admin/invoices', '/admin/orders', '/admin/payments'] },
  { id: 'website', label: 'Website', paths: ['/admin/blogs', '/admin/services', '/admin/careers', '/admin/site-content', '/admin/reviews', '/admin/chatbot'] },
  { id: 'support', label: 'Support', paths: ['/admin/notifications', '/admin/announcements', '/admin/assets', '/admin/training', '/admin/performance', '/admin/helpdesk', '/admin/inbox', '/admin/support'] },
  { id: 'reports', label: 'Reports', paths: ['/admin/reports'] },
  { id: 'settings', label: 'Settings', paths: ['/admin/settings'] },
  { id: 'account', label: 'My Account', paths: ['/admin/profile', '/admin/change-password', '/admin/security'] },
]

const adminExtraLabels: Record<string, string> = {
  '/admin/profile': 'My Profile',
  '/admin/change-password': 'Change Password',
  '/admin/security': 'Security',
  '/admin/inbox': 'Inbox',
  '/admin/customers': 'Customers',
}

export function resolveAdminNavItem(pathname: string): AdminNavItem | undefined {
  const exact = adminNav.find((item) => item.to === pathname)
  if (exact) return exact

  return adminNav.find(
    (item) => item.to !== '/admin' && pathname.startsWith(`${item.to}/`),
  )
}

export function getAdminGroupLabel(pathname: string): string | undefined {
  const item = resolveAdminNavItem(pathname)
  if (!item) return undefined
  return adminNavGroups.find((group) => group.paths.includes(item.to))?.label
}

export interface AdminBreadcrumbSegment {
  label: string
  href?: string
}

export function getAdminBreadcrumbs(pathname: string): AdminBreadcrumbSegment[] {
  const segments: AdminBreadcrumbSegment[] = [
    { label: 'Admin', href: '/admin' },
  ]

  if (pathname === '/admin') {
    segments.push({ label: 'Dashboard' })
    return segments
  }

  const navItem = resolveAdminNavItem(pathname)
  const groupLabel = getAdminGroupLabel(pathname)

  if (groupLabel && groupLabel !== 'Dashboard') {
    segments.push({ label: groupLabel })
  }

  if (navItem) {
    const isDetail = pathname !== navItem.to
    segments.push({
      label: navItem.label,
      href: isDetail ? navItem.to : undefined,
    })

    if (isDetail) {
      const tail = pathname.slice(navItem.to.length + 1)
      if (tail && !/^\d+$/.test(tail)) {
        segments.push({
          label: tail.split('/').map((part) =>
            part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          ).join(' / '),
        })
      } else {
        segments.push({ label: 'Details' })
      }
    }
    return segments
  }

  const extra = adminExtraLabels[pathname]
  if (extra) {
    segments.push({ label: extra })
    return segments
  }

  const fallback = pathname.replace('/admin/', '').replace(/-/g, ' ')
  segments.push({
    label: fallback.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Page',
  })
  return segments
}
