import { cn } from '@/lib/utils'
import { BotAvatar } from './BotAvatar'

interface MessageBubbleProps {
  role: 'user' | 'bot'
  text: string
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('chatbot-message', isUser ? 'chatbot-message--user' : 'chatbot-message--bot')}>
      {!isUser && <BotAvatar />}
      <div className="chatbot-message__bubble">
        {text.split('\n').map((line, index) => (
          <p key={`${index}-${line.slice(0, 12)}`} className="chatbot-message__line">
            {line || '\u00A0'}
          </p>
        ))}
      </div>
    </div>
  )
}
