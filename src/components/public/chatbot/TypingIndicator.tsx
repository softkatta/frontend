import { cn } from '@/lib/utils'
import { BotAvatar } from './BotAvatar'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('chatbot-message chatbot-message--bot chatbot-message--typing', className)} aria-label="Assistant is typing">
      <BotAvatar />
      <div className="chatbot-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
