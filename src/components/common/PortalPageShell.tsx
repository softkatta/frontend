import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { AdminPageSkeleton } from '@/components/admin/shell/AdminPageSkeleton'

type PortalPageShellProps = {
  eyebrow: string
  heroTitle: string
  heroDescription?: string
  heroAside?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  loading?: boolean
  error?: string | null
  children: ReactNode
  size?: 'default' | 'narrow' | 'wide'
  layout?: 'panel' | 'sections'
}

export function PortalPageShell({
  eyebrow,
  heroTitle,
  heroDescription,
  heroAside,
  title,
  description,
  actions,
  loading,
  error,
  children,
  size = 'default',
  layout = 'panel',
}: PortalPageShellProps) {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  const body = loading ? (
    isAdmin ? (
      <AdminPageSkeleton />
    ) : (
      <div className="flex justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
      </div>
    )
  ) : error ? (
    <div className="portal-page-shell__error" role="alert">
      {error}
    </div>
  ) : layout === 'sections' ? (
    <div className="space-y-6">{children}</div>
  ) : (
    children
  )

  return (
    <PortalPage className="space-y-6" size={size}>
      <PortalWelcome
        eyebrow={eyebrow}
        title={heroTitle}
        description={heroDescription}
        aside={heroAside}
      />

      <PageHeader title={title} description={description} className="mb-0">
        {actions}
      </PageHeader>

      {layout === 'sections' ? body : (
        <PortalPanel className={cn('portal-page-shell__panel', isAdmin && 'admin-portal-panel')}>
          <div className="portal-page-shell__body">{body}</div>
        </PortalPanel>
      )}
    </PortalPage>
  )
}
