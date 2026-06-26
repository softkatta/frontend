import { LoadingSpinner } from './LoadingSpinner'

export function RouteHydrateFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  )
}
