import type { ReactNode } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'

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
  const body = loading ? (
    <div className="flex justify-center p-16">
      <LoadingSpinner size="lg" />
    </div>
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
        <PortalPanel className="portal-page-shell__panel">
          <div className="portal-page-shell__body">{body}</div>
        </PortalPanel>
      )}
    </PortalPage>
  )
}
