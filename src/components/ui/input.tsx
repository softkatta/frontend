import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Strip letters/symbols — only digits (and optional decimal) can be entered. */
  digitsOnly?: boolean
  /** Max digit count (integer part when allowDecimal). */
  maxDigits?: number
  /** Allow a single decimal point (for amounts). */
  allowDecimal?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

function sanitizeDigits(value: string, allowDecimal?: boolean, maxDigits?: number): string {
  let next = allowDecimal
    ? value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    : value.replace(/\D/g, '')

  if (maxDigits != null && maxDigits >= 0) {
    if (allowDecimal) {
      const [intPart = '', decPart] = next.split('.')
      next = decPart !== undefined
        ? `${intPart.slice(0, maxDigits)}.${decPart}`
        : intPart.slice(0, maxDigits)
    } else {
      next = next.slice(0, maxDigits)
    }
  }

  return next
}

function isAllowedKey(event: React.KeyboardEvent<HTMLInputElement>, allowDecimal?: boolean): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true

  const key = event.key
  if (
    key === 'Backspace'
    || key === 'Delete'
    || key === 'Tab'
    || key === 'Escape'
    || key === 'Enter'
    || key === 'ArrowLeft'
    || key === 'ArrowRight'
    || key === 'ArrowUp'
    || key === 'ArrowDown'
    || key === 'Home'
    || key === 'End'
  ) {
    return true
  }

  if (/^\d$/.test(key)) return true
  if (allowDecimal && key === '.' && !event.currentTarget.value.includes('.')) return true

  return false
}

function setNativeValue(element: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  setter?.call(element, value)
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      digitsOnly = false,
      maxDigits,
      allowDecimal = false,
      onChange,
      onKeyDown,
      onPaste,
      inputMode,
      pattern,
      autoComplete,
      min: _min,
      max: _max,
      step: _step,
      ...props
    },
    ref,
  ) => {
    const numericType = type === 'number'
    const enforceDigits = digitsOnly || numericType
    const decimalAllowed = allowDecimal || numericType

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      if (enforceDigits) {
        const cleaned = sanitizeDigits(event.target.value, decimalAllowed, maxDigits)
        if (event.target.value !== cleaned) {
          setNativeValue(event.target, cleaned)
        }
      }
      onChange?.(event)
    }

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
      if (enforceDigits && !isAllowedKey(event, decimalAllowed)) {
        event.preventDefault()
      }
      onKeyDown?.(event)
    }

    const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
      if (enforceDigits) {
        event.preventDefault()
        const pasted = event.clipboardData.getData('text')
        const cleaned = sanitizeDigits(pasted, decimalAllowed, maxDigits)
        const target = event.currentTarget
        const start = target.selectionStart ?? target.value.length
        const end = target.selectionEnd ?? target.value.length
        const merged = sanitizeDigits(
          `${target.value.slice(0, start)}${cleaned}${target.value.slice(end)}`,
          decimalAllowed,
          maxDigits,
        )
        setNativeValue(target, merged)
        onChange?.({
          target,
          currentTarget: target,
        } as React.ChangeEvent<HTMLInputElement>)
        return
      }
      onPaste?.(event)
    }

    return (
      <input
        type={enforceDigits ? (type === 'password' ? 'password' : 'text') : type}
        inputMode={enforceDigits ? (decimalAllowed ? 'decimal' : 'numeric') : inputMode}
        pattern={enforceDigits ? (decimalAllowed ? '[0-9]*[.]?[0-9]*' : '[0-9]*') : pattern}
        autoComplete={autoComplete ?? (enforceDigits ? 'off' : undefined)}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] backdrop-blur-sm px-4 py-2 text-sm transition-all duration-200',
          'placeholder:text-[var(--muted-foreground)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary/50 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
