import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, logoutUser, registerUser } from '@/store/slices/authSlice'
import type { LoginCredentials, RegisterData, User } from '@/types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, isHydrated } = useAppSelector((state) => state.auth)

  const login = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      const result = await dispatch(loginUser({ credentials, redirectTo }))
      if (loginUser.fulfilled.match(result)) {
        const role = result.payload.user.role
        if (redirectTo) {
          navigate(redirectTo)
        } else {
          navigate(role === 'admin' || role === 'staff' ? '/admin' : '/dashboard')
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
    const wasAdmin = user?.role === 'admin' || user?.role === 'staff'
    await dispatch(logoutUser())
    navigate(wasAdmin ? '/admin' : '/login')
  }, [dispatch, navigate, user?.role])

  const hasRole = useCallback(
    (...roles: User['role'][]) => {
      return user ? roles.includes(user.role) : false
    },
    [user],
  )

  return { user, isAuthenticated, isLoading, isHydrated, login, register, logout, hasRole }
}
