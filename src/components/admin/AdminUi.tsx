import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function AdminTabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsList className={cn('admin-portal-tabs', className)}>
      {children}
    </TabsList>
  )
}

type AdminTabsTriggerProps = ComponentPropsWithoutRef<typeof TabsTrigger> & {
  icon?: LucideIcon
}

export function AdminTabsTrigger({ children, className, icon: Icon, ...props }: AdminTabsTriggerProps) {
  return (
    <TabsTrigger className={cn('admin-portal-tabs__trigger', className)} {...props}>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </TabsTrigger>
  )
}

type AdminPanelHeaderProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function AdminPanelHeader({ icon: Icon, title, description, action }: AdminPanelHeaderProps) {
  return (
    <div className="admin-panel-header">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="admin-panel-header__icon">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}

export function AdminToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('admin-toolbar', className)}>
      {children}
    </div>
  )
}

export function AdminSaveBar({ children }: { children: ReactNode }) {
  return (
    <div className="admin-save-bar">
      {children}
    </div>
  )
}
