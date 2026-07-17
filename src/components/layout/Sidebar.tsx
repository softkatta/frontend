import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, Settings, ShieldCheck,
  Menu, X, Search, Star, Users, UserRound,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from './ThemeToggle'
import { NotificationDropdown } from './NotificationDropdown'
import { ProfileMenu } from './ProfileMenu'
import { AdminQuickSearch, AdminQuickSearchTrigger } from '@/components/admin/shell/AdminQuickSearch'
import { AdminSettingsPanel } from '@/components/admin/shell/AdminSettingsPanel'
import { BrandLogo } from '@/components/common/BrandLogo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { useAuth } from '@/hooks/useAuth'
import { canAccessPath } from '@/lib/accessControl'
import { adminNav, adminNavGroups, type AdminNavGroupDef } from '@/lib/adminNavigation'
import { clientNav, clientNavGroups } from '@/lib/clientNavigation'
import { employeeNav, employeeNavGroups } from '@/lib/employeeNavigation'
import { hrNav, hrNavGroups } from '@/lib/hrNavigation'
import { useAppSelector } from '@/store/hooks'
import { getAdminWorkspaceMode, setAdminWorkspaceMode, type AdminWorkspaceMode } from '@/services/api/client'
import type { UserRole } from '@/types'

export type SidebarVariant = 'client' | 'admin' | 'employee' | 'hr'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

/** Client nav — see lib/clientNavigation.ts */
/** Employee nav — see lib/employeeNavigation.ts */
/** HR nav — see lib/hrNavigation.ts */

/** UI-only grouping — references existing `to` paths, does not alter menu data */
type NavGroupDef = AdminNavGroupDef

function navItemsForVariant(variant: SidebarVariant, user: ReturnType<typeof useAuth>['user']): NavItem[] {
  const items =
    variant === 'admin' ? adminNav
    : variant === 'employee' ? employeeNav
    : variant === 'hr' ? hrNav
    : clientNav

  return items.filter((item) => canAccessPath(user, item.to))
}

function navGroupsForVariant(variant: SidebarVariant): NavGroupDef[] {
  if (variant === 'admin') return adminNavGroups
  if (variant === 'employee') return employeeNavGroups
  if (variant === 'hr') return hrNavGroups
  return clientNavGroups
}

function pinsStorageKey(variant: SidebarVariant) {
  return `softkatta:sidebar-pins:${variant}`
}

function scrollStorageKey(variant: SidebarVariant) {
  return `softkatta:sidebar-scroll:${variant}`
}

function loadPinnedPaths(variant: SidebarVariant): string[] {
  try {
    const raw = localStorage.getItem(pinsStorageKey(variant))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

function savePinnedPaths(variant: SidebarVariant, paths: string[]) {
  localStorage.setItem(pinsStorageKey(variant), JSON.stringify(paths))
}

function buildGroupedNav(items: NavItem[], groups: NavGroupDef[]) {
  const itemMap = new Map(items.map((item) => [item.to, item]))
  const grouped = groups.map((group) => ({
    ...group,
    items: group.paths.map((path) => itemMap.get(path)).filter(Boolean) as NavItem[],
  }))
  const used = new Set(groups.flatMap((g) => g.paths))
  const ungrouped = items.filter((item) => !used.has(item.to))
  if (ungrouped.length > 0) {
    grouped.push({ id: 'other', label: 'More', paths: ungrouped.map((i) => i.to), items: ungrouped })
  }
  return grouped.filter((g) => g.items.length > 0)
}

function findGroupForPath(groups: ReturnType<typeof buildGroupedNav>, pathname: string) {
  return groups.find((group) =>
    group.items.some((item) =>
      pathname === item.to || (item.to !== '/admin' && item.to !== '/dashboard' && item.to !== '/hr' && pathname.startsWith(`${item.to}/`)),
    ),
  )?.id ?? groups[0]?.id ?? null
}

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.to === '/admin' || item.to === '/dashboard' || item.to === '/employee' || item.to === '/hr') {
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

interface SidebarProps {
  variant: SidebarVariant
  collapsed: boolean
  onToggle: () => void
}

function roleLabel(role?: UserRole, companyRoleName?: string) {
  if (role === 'admin') return 'Super Admin'
  if (role === 'employee') return companyRoleName || 'Employee'
  if (role === 'hr') return 'HR Manager'
  return 'Client'
}

function SidebarRoleFooter({ collapsed, role, companyRoleName }: { collapsed: boolean; role?: UserRole; companyRoleName?: string }) {
  const label = roleLabel(role, companyRoleName)
  const isAdmin = role === 'admin'
  const isHr = role === 'hr'
  const Icon = isAdmin ? ShieldCheck : isHr ? Users : UserRound

  return (
    <div className="border-t border-[var(--border)] p-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2.5',
          isAdmin
            ? 'border-[var(--brand-blue)]/20 bg-[var(--brand-blue)]/8 text-[var(--brand-blue)]'
            : isHr
              ? 'border-violet-500/20 bg-violet-500/8 text-violet-700 dark:text-violet-300'
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

type SidebarNavBodyProps = {
  variant: SidebarVariant
  items: NavItem[]
  collapsed: boolean
  onNavigate?: () => void
  unreadCount: number
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
  unreadCount,
  isPinned,
  onTogglePin,
  showPin,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
  unreadCount: number
  isPinned?: boolean
  onTogglePin?: () => void
  showPin?: boolean
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard' || item.to === '/admin'}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group/link flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-[var(--brand-blue)]/12 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)] border border-[var(--brand-blue)]/20 shadow-sm'
            : 'text-[var(--muted-foreground)] hover:bg-[var(--input)] hover:text-foreground border border-transparent',
          collapsed && 'justify-center px-2 py-2.5',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.label === 'Notifications' && unreadCount > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] text-white">
          {unreadCount}
        </span>
      )}
      {showPin && !collapsed && onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onTogglePin()
          }}
          className={cn(
            'ml-auto rounded-md p-1 opacity-0 transition-opacity group-hover/link:opacity-100',
            isPinned ? 'opacity-100 text-amber-500' : 'text-[var(--muted-foreground)] hover:text-foreground',
          )}
          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
        >
          <Star className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} />
        </button>
      )}
    </NavLink>
  )
}

/** Shared nav body — used by desktop sidebar and mobile drawer */
function SidebarNavBody({ variant, items, collapsed, onNavigate, unreadCount }: SidebarNavBodyProps) {
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const groups = useMemo(
    () => buildGroupedNav(items, navGroupsForVariant(variant)),
    [items, variant],
  )

  const [search, setSearch] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => findGroupForPath(groups, location.pathname))
  const [pinnedPaths, setPinnedPaths] = useState<string[]>(() => loadPinnedPaths(variant))

  // Keep active section expanded when route changes
  useEffect(() => {
    const activeGroup = findGroupForPath(groups, location.pathname)
    if (activeGroup) setExpandedGroup(activeGroup)
  }, [location.pathname, groups])

  // Restore scroll position between navigations
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const saved = sessionStorage.getItem(scrollStorageKey(variant))
    if (saved) el.scrollTop = Number(saved)
  }, [variant])

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const onScroll = () => sessionStorage.setItem(scrollStorageKey(variant), String(el.scrollTop))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [variant])

  const togglePin = useCallback((path: string) => {
    setPinnedPaths((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      savePinnedPaths(variant, next)
      return next
    })
  }, [variant])

  const pinnedItems = useMemo(
    () => pinnedPaths.map((path) => items.find((item) => item.to === path)).filter(Boolean) as NavItem[],
    [pinnedPaths, items],
  )

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return items.filter((item) => item.label.toLowerCase().includes(q) || item.to.toLowerCase().includes(q))
  }, [items, search])

  const isSearching = search.trim().length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search — hidden when sidebar is icon-only */}
      {!collapsed && (
        <div className="shrink-0 border-b border-[var(--border)] px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menus..."
              className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)]/50 pl-9 text-sm"
            />
          </div>
        </div>
      )}

      <nav ref={navRef} className="sidebar-nav-scroll flex-1 overflow-y-auto p-2 sm:p-3">
        {/* Pinned / Favorites */}
        {pinnedItems.length > 0 && (
          <div className={cn('mb-3', collapsed && 'mb-2')}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Pinned
              </p>
            )}
            <div className="space-y-0.5">
              {pinnedItems.map((item) => (
                <SidebarNavLink
                  key={`pin-${item.to}`}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  unreadCount={unreadCount}
                  isPinned
                  onTogglePin={() => togglePin(item.to)}
                  showPin={!collapsed}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search results — flat list */}
        {isSearching && !collapsed ? (
          <div className="space-y-0.5">
            {searchResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">No menus found</p>
            ) : (
              searchResults.map((item) => (
                <SidebarNavLink
                  key={`search-${item.to}`}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  unreadCount={unreadCount}
                  isPinned={pinnedPaths.includes(item.to)}
                  onTogglePin={() => togglePin(item.to)}
                  showPin
                />
              ))
            )}
          </div>
        ) : collapsed ? (
          /* Collapsed — flat icon rail with native tooltips */
          <div className="space-y-0.5">
            {items.filter((item) => !pinnedPaths.includes(item.to)).map((item) => (
              <SidebarNavLink
                key={item.to}
                item={item}
                collapsed
                onNavigate={onNavigate}
                unreadCount={unreadCount}
              />
            ))}
          </div>
        ) : (
          /* Expanded — accordion groups, one open at a time */
          <div className="space-y-1">
            {groups.map((group) => {
              const visibleItems = group.items.filter((item) => !pinnedPaths.includes(item.to))
              if (visibleItems.length === 0) return null

              const isOpen = expandedGroup === group.id
              const hasActiveChild = visibleItems.some((item) => isNavItemActive(location.pathname, item))

              return (
                <div key={group.id} className="rounded-xl">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isOpen ? null : group.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors',
                      hasActiveChild
                        ? 'text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--input)]/60 hover:text-foreground',
                    )}
                  >
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                    <span className="truncate">{group.label}</span>
                    {hasActiveChild && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)]" aria-hidden />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-0.5 pb-1 pl-1">
                          {visibleItems.map((item) => (
                            <SidebarNavLink
                              key={item.to}
                              item={item}
                              collapsed={false}
                              onNavigate={onNavigate}
                              unreadCount={unreadCount}
                              isPinned={pinnedPaths.includes(item.to)}
                              onTogglePin={() => togglePin(item.to)}
                              showPin
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </nav>
    </div>
  )
}

export function Sidebar({ variant, collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth()
  const { logoUrl, companyName } = useSiteBranding()
  const navItems = useMemo(() => navItemsForVariant(variant, user), [variant, user])
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] backdrop-blur-2xl transition-all duration-300 lg:flex',
        variant === 'admin' && 'admin-sidebar',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn(
        'flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-3',
        variant === 'admin' && 'admin-sidebar__brand',
      )}>
        {collapsed ? (
          <Link to="/" className="mx-auto shrink-0" aria-label={`${companyName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 w-8 rounded-md object-contain" />
            ) : (
              <BrandLogo size="sm" className="min-w-0" />
            )}
          </Link>
        ) : (
          <BrandLogo size="sm" className="min-w-0" />
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn('shrink-0', collapsed && 'mx-auto')}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <SidebarNavBody variant={variant} items={navItems} collapsed={collapsed} unreadCount={unreadCount} />

      <SidebarRoleFooter collapsed={collapsed} role={user?.role} companyRoleName={user?.company_role?.name} />
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
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
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
    <>
      {variant === 'admin' ? (
        <>
          <AdminQuickSearch open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />
          <AdminSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
      ) : null}
      <header
        className={cn(
          'fixed top-0 right-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] glass px-4 sm:px-6 transition-all duration-300',
          variant === 'admin' && 'admin-topbar',
          collapsed ? 'left-0 lg:left-[72px]' : 'left-0 lg:left-64',
        )}
      >
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>

        {variant === 'admin' ? (
          <>
            <AdminQuickSearchTrigger
              onClick={() => setQuickSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-md"
            />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 rounded-xl"
              onClick={() => setQuickSearchOpen(true)}
              aria-label="Search admin pages"
            >
              <Search className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {variant === 'admin' ? (
            <>
              <span className={cn('admin-topbar__workspace hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide', workspaceBadgeClass)}>
                {workspaceLabel}
              </span>
              <label className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--input)]/40 px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
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
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex rounded-xl"
                onClick={() => setSettingsOpen(true)}
                aria-label="Admin preferences"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </>
          ) : null}
          <ThemeToggle />
          <NotificationDropdown variant={variant} />
          <ProfileMenu variant={variant} />
        </div>
      </header>
    </>
  )
}

interface MobileSidebarProps {
  variant: SidebarVariant
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ variant, open, onClose }: MobileSidebarProps) {
  const { user } = useAuth()
  const navItems = useMemo(() => navItemsForVariant(variant, user), [variant, user])
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)

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
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed left-0 top-0 z-50 flex h-screen w-[min(100vw-3rem,18rem)] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] backdrop-blur-xl lg:hidden',
              variant === 'admin' && 'admin-mobile-sidebar',
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
              <BrandLogo size="sm" className="min-w-0" />
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <SidebarNavBody
              variant={variant}
              items={navItems}
              collapsed={false}
              onNavigate={onClose}
              unreadCount={unreadCount}
            />

            <SidebarRoleFooter collapsed={false} role={user?.role} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
