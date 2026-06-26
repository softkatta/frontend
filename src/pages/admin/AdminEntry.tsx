import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'

export default function AdminEntry() {
  const { isAuthenticated, isHydrated, hasRole } = useAuth()

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && !hasRole('admin', 'staff')) {
    return <Navigate to="/dashboard" replace />
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
}
