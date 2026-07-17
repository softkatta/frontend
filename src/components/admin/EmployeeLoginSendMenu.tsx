import { KeyRound, Mail, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SendChannel = 'email' | 'whatsapp'

type EmployeeLoginSendMenuProps = {
  disabled?: boolean
  onSelect: (channel: SendChannel) => void
}

export function EmployeeLoginSendMenu({ disabled, onSelect }: EmployeeLoginSendMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          disabled={disabled}
          title="Send login details"
          aria-label="Send login details"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Send login details</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelect('email')}>
          <Mail className="h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('whatsapp')}>
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
