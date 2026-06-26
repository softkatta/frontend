import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type TableActionItem = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  variant?: 'default' | 'destructive' | 'ghost' | 'outline'
  hidden?: boolean
}

interface TableActionsProps {
  actions: TableActionItem[]
  className?: string
}

export function TableActions({ actions, className }: TableActionsProps) {
  const visible = actions.filter((action) => !action.hidden)

  if (visible.length === 0) return null

  return (
    <div
      className={cn('flex items-center justify-end gap-0.5', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="group"
    >
      {visible.map((action) => {
        const isDestructive = action.variant === 'destructive'

        return (
        <Button
          key={action.label}
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0',
            isDestructive
              ? 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          )}
          onClick={action.onClick}
          title={action.label}
          aria-label={action.label}
        >
          <action.icon className="h-4 w-4" />
        </Button>
        )
      })}
    </div>
  )
}
