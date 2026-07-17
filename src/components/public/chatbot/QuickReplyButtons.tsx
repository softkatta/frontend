import { cn } from '@/lib/utils'
import type { ChatbotQuickReply } from '@/types/chatbot'

interface QuickReplyButtonsProps {
  items: ChatbotQuickReply[]
  onSelect: (key: string, label: string) => void
  className?: string
}

export function QuickReplyButtons({ items, onSelect, className }: QuickReplyButtonsProps) {
  if (!items.length) return null

  return (
    <div className={cn('chatbot-quick-replies', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="chatbot-quick-replies__btn"
          onClick={() => onSelect(item.key, item.label)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
