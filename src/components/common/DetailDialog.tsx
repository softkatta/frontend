import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function DetailDialog({ open, onOpenChange, title, description, children }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : 'sr-only'}>
            {description || title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
