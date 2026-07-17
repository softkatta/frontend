import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { HrLayout } from '@/components/layout/HrLayout'

export function HrProtectedLayout() {
  return (
    <ProtectedRoute loginPath="/hr" allowedRoles={['hr']}>
      <HrLayout />
    </ProtectedRoute>
  )
}
