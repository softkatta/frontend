import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, CreditCard, FileText, Bell, LifeBuoy,
  ChevronLeft, ChevronRight, Settings, ShieldCheck, UserRound,
  Users, ShoppingCart, BarChart3, BookOpen, Menu, X, ImagePlus,
  Layers, FolderTree, Wallet,
  Building2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { NotificationDropdown } from './NotificationDropdown'
import { ProfileMenu } from './ProfileMenu'
import { BrandLogo } from '@/components/common/BrandLogo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/store/hooks'
import { getAdminWorkspaceMode, setAdminWorkspaceMode, type AdminWorkspaceMode } from '@/services/api/client'
import type { UserRole } from '@/types'

export type SidebarVariant = 'client' | 'admin'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const clientNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/support', label: 'Support', icon: LifeBuoy },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/plans', label: 'Plans', icon: Layers },
  { to: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { to: '/admin/site-content', label: 'Site Content', icon: ImagePlus },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  variant: SidebarVariant
  collapsed: boolean
  onToggle: () => void
}

function roleLabel(role?: UserRole) {
  if (role === 'admin') return 'Super Admin'
  if (role === 'staff') return 'Staff'
  return 'Client'
}

function SidebarRoleFooter({ collapsed, role }: { collapsed: boolean; role?: UserRole }) {
  const label = roleLabel(role)
  const isAdmin = role === 'admin' || role === 'staff'
  const Icon = isAdmin ? ShieldCheck : UserRound

  return (
    <div className="border-t border-[var(--border)] p-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2.5',
          isAdmin
            ? 'border-[var(--brand-blue)]/20 bg-[var(--brand-blue)]/8 text-[var(--brand-blue)]'
            : 'border-[var(--border)] bg-[var(--input)]/60 text-[var(--muted-foreground)]',
          collapsed && 'justify-center px-2',
        )}
        title={label}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="text-xs font-semibold uppercase tracking-wide">{label}</span> : null}
      </div>
    </div>
  )
}

export function Sidebar({ variant, collapsed, onToggle }: SidebarProps) {
  const navItems = variant === 'admin' ? adminNav : clientNav
  const { logoUrl, companyName } = useSiteBranding()
  const { user } = useAuth()
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] backdrop-blur-2xl transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
        {collapsed ? (
          <Link to="/" className="mx-auto shrink-0" aria-label={`${companyName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 w-8 object-contain rounded-md" />
            ) : (
              <BrandLogo size="sm" className="min-w-0" />
            )}
          </Link>
        ) : (
          <BrandLogo size="sm" className="min-w-0" />
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn(collapsed && 'mx-auto')}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-[var(--brand-blue)]/12 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)] border border-[var(--brand-blue)]/20 shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--input)] hover:text-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <SidebarRoleFooter collapsed={collapsed} role={user?.role} />
    </aside>
  )
}

interface DashboardHeaderProps {
  title?: string
  collapsed: boolean
  onMenuToggle: () => void
  variant?: SidebarVariant
}

export function DashboardHeader({ collapsed, onMenuToggle, variant = 'client' }: DashboardHeaderProps) {
  const [workspace, setWorkspace] = useState<AdminWorkspaceMode>(getAdminWorkspaceMode())
  const workspaceLabel = workspace === 'demo' ? 'DEMO WORKSPACE' : 'LIVE WORKSPACE'
  const workspaceBadgeClass = workspace === 'demo'
    ? 'border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300'
    : 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'

  useEffect(() => {
    if (variant !== 'admin') {
      return
    }

    const onStorage = () => setWorkspace(getAdminWorkspaceMode())
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [variant])

  const handleWorkspaceChange = (value: AdminWorkspaceMode) => {
    setAdminWorkspaceMode(value)
    setWorkspace(value)

    if (variant === 'admin' && typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] glass px-6 transition-all duration-300',
        collapsed ? 'left-[72px]' : 'left-64',
      )}
    >
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 sm:gap-3">
        {variant === 'admin' ? (
          <>
            <span className={cn('hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide', workspaceBadgeClass)}>
              {workspaceLabel}
            </span>
            <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--input)]/40 px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              <span>Workspace</span>
              <select
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-foreground focus:outline-none"
                value={workspace}
                onChange={(event) => handleWorkspaceChange(event.target.value as AdminWorkspaceMode)}
              >
                <option value="live">Live</option>
                <option value="demo">Demo</option>
              </select>
            </label>
          </>
        ) : null}
        <ThemeToggle />
        <NotificationDropdown variant={variant} />
        <ProfileMenu variant={variant} />
      </div>
    </header>
  )
}

interface MobileSidebarProps {
  variant: SidebarVariant
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ variant, open, onClose }: MobileSidebarProps) {
  const navItems = variant === 'admin' ? adminNav : clientNav
  const { user } = useAuth()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--border)] lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
              <span className="font-bold">Menu</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-[var(--brand-blue)]/12 text-[var(--brand-blue)]' : 'text-[var(--muted-foreground)]',
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <SidebarRoleFooter collapsed={false} role={user?.role} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
