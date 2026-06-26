import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  loginPath?: string
}

export function ProtectedRoute({ children, allowedRoles, loginPath = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (allowedRoles && user && !hasRole(...allowedRoles)) {
    const redirect = user.role === 'admin' || user.role === 'staff' ? '/admin' : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
