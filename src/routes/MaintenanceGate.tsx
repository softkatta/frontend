import { Outlet, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { MaintenancePage } from '@/pages/public/MaintenancePage'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function MaintenanceGate() {
  const maintenance = useMaintenanceMode()
  const { pathname } = useLocation()

  if (maintenance.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-premium-gradient">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (maintenance.enabled && !isAdminRoute(pathname)) {
    const { loading: _loading, ...content } = maintenance
    return <MaintenancePage content={content} />
  }

  return <Outlet />
}
