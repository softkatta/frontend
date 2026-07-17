import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BotAvatarProps {
  size?: 'sm' | 'md'
  className?: string
}

export function BotAvatar({ size = 'sm', className }: BotAvatarProps) {
  return (
    <div
      className={cn('chatbot-avatar', size === 'md' && 'chatbot-avatar--md', className)}
      aria-hidden
    >
      <Bot className={size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
    </div>
  )
}
