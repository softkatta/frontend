import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'

export function AdminProtectedLayout() {
  return (
    <ProtectedRoute loginPath="/admin" allowedRoles={['admin']}>
      <AdminLayout />
    </ProtectedRoute>
  )
}
