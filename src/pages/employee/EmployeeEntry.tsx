import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmployeeLayout } from '@/components/layout/EmployeeLayout'
import EmployeeDashboardPage from '@/pages/employee/EmployeeDashboardPage'
import EmployeeLoginPage from '@/pages/employee/EmployeeLoginPage'

export default function EmployeeEntry() {
  const { isAuthenticated, isHydrated, hasRole } = useAuth()

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && !hasRole('employee')) {
    return <Navigate to={hasRole('admin') ? '/admin' : hasRole('hr') ? '/hr' : '/dashboard'} replace />
  }

  if (!isAuthenticated) {
    return <EmployeeLoginPage />
  }

  return (
    <EmployeeLayout>
      <EmployeeDashboardPage />
    </EmployeeLayout>
  )
}
