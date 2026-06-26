import type { ReactNode } from 'react'
import { PortalPanel } from '@/components/common/PortalPage'

interface SecuritySectionCardProps {
  title: string
  description: string
  action?: ReactNode
  children?: ReactNode
}

export function SecuritySectionCard({
  title,
  description,
  action,
  children,
}: SecuritySectionCardProps) {
  return (
    <PortalPanel className="shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
          {action}
        </div>
        {children ? (
          <div className="mt-5 border-t border-[var(--border)] pt-5">{children}</div>
        ) : null}
      </div>
    </PortalPanel>
  )
}
