import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] backdrop-blur-sm px-4 py-2 text-sm transition-all duration-200',
          'placeholder:text-[var(--muted-foreground)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary/50 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
