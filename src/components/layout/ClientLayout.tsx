import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, DashboardHeader, MobileSidebar } from './Sidebar'
import { SmoothScroll } from '@/components/common/SmoothScroll'
import { useNotificationsSync } from '@/hooks/useNotificationsSync'
import { cn } from '@/lib/utils'

export function ClientLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useNotificationsSync(true)

  return (
    <div className="dashboard-shell min-h-screen gradient-bg">
      <SmoothScroll />
      <Sidebar variant="client" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileSidebar variant="client" open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <DashboardHeader collapsed={collapsed} onMenuToggle={() => setMobileOpen(true)} />
      <main
        className={cn(
          'min-h-screen pt-[calc(4rem+2rem)] px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10 transition-all duration-300',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
