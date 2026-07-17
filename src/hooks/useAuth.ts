import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, logoutUser, registerUser } from '@/store/slices/authSlice'
import type { LoginCredentials, RegisterData, User, UserRole } from '@/types'
import { canAccessPath, hasAnyPermission, hasPermission } from '@/lib/accessControl'

function redirectPathForRole(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'employee') return '/employee'
  if (role === 'hr') return '/hr'
  return '/dashboard'
}

export function useAuth() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, isHydrated } = useAppSelector((state) => state.auth)

  const login = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      const result = await dispatch(loginUser({ credentials, redirectTo }))
      if (loginUser.fulfilled.match(result)) {
        if (redirectTo) {
          navigate(redirectTo)
        } else {
          navigate(redirectPathForRole(result.payload.user.role))
        }
      }
      return result
    },
    [dispatch, navigate],
  )

  const register = useCallback(
    async (registerData: RegisterData, redirectTo?: string) => {
      const result = await dispatch(registerUser({ data: registerData, redirectTo }))
      if (registerUser.fulfilled.match(result)) {
        navigate(redirectTo ?? '/dashboard')
      }
      return result
    },
    [dispatch, navigate],
  )

  const logout = useCallback(async () => {
    const role = user?.role
    await dispatch(logoutUser())
    if (role === 'admin') navigate('/admin')
    else if (role === 'employee') navigate('/employee')
    else if (role === 'hr') navigate('/hr')
    else navigate('/login')
  }, [dispatch, navigate, user?.role])

  const hasRole = useCallback(
    (...roles: User['role'][]) => {
      return user ? roles.includes(user.role) : false
    },
    [user],
  )

  const can = useCallback(
    (permission: string) => hasPermission(user, permission),
    [user],
  )

  const canAny = useCallback(
    (...permissions: string[]) => hasAnyPermission(user, permissions),
    [user],
  )

  const canAccess = useCallback(
    (path: string) => canAccessPath(user, path),
    [user],
  )

  return { user, isAuthenticated, isLoading, isHydrated, login, register, logout, hasRole, can, canAny, canAccess }
}
