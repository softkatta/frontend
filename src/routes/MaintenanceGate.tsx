import { Outlet, useLocation } from 'react-router-dom'
import { MaintenancePage } from '@/pages/public/MaintenancePage'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function MaintenanceGate() {
  const maintenance = useMaintenanceMode()
  const { pathname } = useLocation()

  if (maintenance.enabled && !maintenance.loading && !isAdminRoute(pathname)) {
    const { loading: _loading, ...content } = maintenance
    return <MaintenancePage content={content} />
  }

  return <Outlet />
}
