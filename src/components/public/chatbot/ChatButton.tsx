import { Bot, ChevronLeft, MessageCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatButtonProps {
  open: boolean
  minimized: boolean
  onClick: () => void
  onPrime?: () => void
  position?: 'left' | 'right'
}

export function ChatButton({ open, minimized, onClick, onPrime, position = 'right' }: ChatButtonProps) {
  if (open && !minimized) return null

  return (
    <button
      type="button"
      aria-label={open ? 'Restore chat' : 'Open chat'}
      className={cn('chatbot-fab', position === 'left' ? 'chatbot-fab--left' : 'chatbot-fab--right')}
      onClick={onClick}
      onMouseEnter={onPrime}
      onFocus={onPrime}
    >
      <span className="chatbot-fab__pulse" aria-hidden />
      <span className="chatbot-fab__glow" aria-hidden />
      <span className="chatbot-fab__icon">
        {open && minimized ? <Minus className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </span>
      {!open && (
        <span className="chatbot-fab__label">
          <MessageCircle className="h-3.5 w-3.5" />
          Chat with us
        </span>
      )}
    </button>
  )
}

interface ChatWindowHeaderProps {
  title: string
  onMinimize: () => void
  onClose: () => void
  onBackToHome?: () => void
}

export function ChatWindowHeader({ title, onMinimize, onClose, onBackToHome }: ChatWindowHeaderProps) {
  return (
    <div className="chatbot-window__header">
      <div className="chatbot-window__header-mesh" aria-hidden />
      <div className="chatbot-window__header-start">
        {onBackToHome ? (
          <button
            type="button"
            className="chatbot-window__back"
            aria-label="Back to topics"
            onClick={onBackToHome}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div className="chatbot-window__header-brand">
          <div className="chatbot-window__avatar">
            <span className="chatbot-window__avatar-ring" aria-hidden />
            <Bot className="h-5 w-5" />
            <span className="chatbot-window__hi-chip">Hi!</span>
          </div>
          <div className="min-w-0">
            <p className="chatbot-window__title">{title}</p>
            <p className="chatbot-window__subtitle">
              <span className="chatbot-window__status" aria-hidden />
              Online · SoftKatta Assistant
            </p>
          </div>
        </div>
      </div>
      <div className="chatbot-window__actions">
        <button type="button" aria-label="Minimize chat" onClick={onMinimize}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Close chat" className="chatbot-window__close" onClick={onClose}>
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  )
}
