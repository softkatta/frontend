import { useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar, DashboardHeader, MobileSidebar } from './Sidebar'
import { SmoothScroll } from '@/components/common/SmoothScroll'
import { PermissionGate } from '@/routes/PermissionGate'
import { useNotificationsSync } from '@/hooks/useNotificationsSync'
import { AdminBreadcrumbs } from '@/components/admin/shell/AdminBreadcrumbs'
import { cn } from '@/lib/utils'

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useNotificationsSync(true)

  return (
    <div className="dashboard-shell admin-panel-shell min-h-screen gradient-bg">
      <SmoothScroll />
      <Sidebar variant="admin" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileSidebar variant="admin" open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <DashboardHeader variant="admin" collapsed={collapsed} onMenuToggle={() => setMobileOpen(true)} />
      <main
        className={cn(
          'admin-main min-h-screen min-w-0 overflow-x-clip px-3 pb-6 transition-all duration-300 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
        )}
      >
        <div className="admin-page-container">
          <AdminBreadcrumbs />
          <PermissionGate>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="admin-page-enter"
            >
              {children ?? <Outlet />}
            </motion.div>
          </PermissionGate>
        </div>
      </main>
    </div>
  )
}
