import { type LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  embedded?: boolean
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  embedded = false,
}: EmptyStateProps) {
  const content = (
    <>
      <div className="portal-empty-state__icon">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-6 rounded-xl glow-btn" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="portal-empty-state portal-empty-state--embedded">
        {content}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="portal-empty-state flex flex-col items-center justify-center py-16 text-center">
        {content}
      </CardContent>
    </Card>
  )
}
