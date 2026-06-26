import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { useAppSelector } from '@/store/hooks'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

function AppShell() {
  const isHydrated = useAppSelector((state) => state.auth.isHydrated)

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <RouterProvider router={router} />
}

function App() {
  return <AppShell />
}

export default App
