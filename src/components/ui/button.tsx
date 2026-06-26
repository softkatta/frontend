import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:bg-[var(--primary)]/90',
        destructive: 'bg-[var(--destructive)] text-white hover:opacity-90 shadow-lg',
        outline: 'border border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-sm hover:border-secondary/40 hover:bg-secondary/5 hover:shadow-md',
        secondary: 'bg-primary text-white hover:bg-primary/90 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-md',
        ghost: 'hover:bg-secondary/10 hover:text-secondary',
        link: 'text-secondary underline-offset-4 hover:underline',
        accent: 'bg-gradient-to-r from-accent to-emerald-500 text-white hover:shadow-lg hover:shadow-accent/30 border-0',
        glass: 'glass text-foreground hover:bg-white/80 dark:hover:bg-slate-800/80',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
