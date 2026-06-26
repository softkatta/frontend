import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setTheme, initTheme } from '@/store/slices/themeSlice'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const dispatch = useAppDispatch()
  const { theme, resolvedTheme } = useAppSelector((state) => state.theme)

  useEffect(() => {
    dispatch(initTheme())
  }, [dispatch])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') dispatch(setTheme('system'))
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme, dispatch])

  const toggleTheme = () => {
    dispatch(setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))
  }

  const changeTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme))
  }

  return { theme, resolvedTheme, toggleTheme, changeTheme, isDark: resolvedTheme === 'dark' }
}
