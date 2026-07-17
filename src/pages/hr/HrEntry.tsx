import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { HrLayout } from '@/components/layout/HrLayout'
import HrDashboardPage from '@/pages/hr/HrDashboardPage'
import HrLoginPage from '@/pages/hr/HrLoginPage'

export default function HrEntry() {
  const { isAuthenticated, isHydrated, hasRole } = useAuth()

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && !hasRole('hr')) {
    return <Navigate to={hasRole('admin') ? '/admin' : hasRole('employee') ? '/employee' : '/dashboard'} replace />
  }

  if (!isAuthenticated) {
    return <HrLoginPage />
  }

  return (
    <HrLayout>
      <HrDashboardPage />
    </HrLayout>
  )
}
