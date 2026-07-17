import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { canAccessPath } from '@/lib/accessControl'
import type { UserRole } from '@/types'

function redirectPathForRole(role?: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'employee') return '/employee'
  if (role === 'hr') return '/hr'
  return '/dashboard'
}

/** Redirects when the current path requires a permission the user lacks. */
export function PermissionGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user && !canAccessPath(user, location.pathname)) {
    return <Navigate to={redirectPathForRole(user.role)} replace />
  }

  return <>{children}</>
}
