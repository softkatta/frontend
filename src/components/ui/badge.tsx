import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        secondary: 'border-transparent bg-primary/10 text-primary dark:text-slate-200',
        destructive: 'border-transparent bg-[var(--destructive)] text-white',
        outline: 'text-foreground border-[var(--border)]',
        success: 'border-transparent bg-accent/15 text-accent',
        warning: 'border-transparent bg-[var(--brand-teal)]/15 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
