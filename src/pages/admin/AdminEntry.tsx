import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))

export default function AdminEntry() {
  const { isAuthenticated, isHydrated, hasRole } = useAuth()

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && !hasRole('admin')) {
    return <Navigate to={hasRole('employee') ? '/employee' : hasRole('hr') ? '/hr' : '/login'} replace />
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />
  }

  return (
    <AdminLayout>
      <Suspense
        fallback={(
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}
      >
        <AdminDashboard />
      </Suspense>
    </AdminLayout>
  )
}
