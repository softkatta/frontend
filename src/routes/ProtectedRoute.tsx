import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermission?: string | string[]
  loginPath?: string
}

function redirectPathForRole(role?: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'employee') return '/employee'
  if (role === 'hr') return '/hr'
  return '/dashboard'
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission, loginPath = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isHydrated, user, hasRole, can, canAny } = useAuth()
  const location = useLocation()

  // Wait until session restore finishes — otherwise a cold load briefly looks logged-out
  // and bounces users (including admins) to /login before hydrateAuth completes.
  if (!isHydrated || isLoading) {
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
    return <Navigate to={redirectPathForRole(user.role)} replace />
  }

  if (requiredPermission && user) {
    const allowed = Array.isArray(requiredPermission)
      ? canAny(...requiredPermission)
      : can(requiredPermission)
    if (!allowed) {
      return <Navigate to={redirectPathForRole(user.role)} replace />
    }
  }

  return <>{children}</>
}
