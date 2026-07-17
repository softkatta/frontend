import { ChevronRight, Minus, X } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'

const DEFAULT_ROBOT_GIF = resolveMediaUrl('/robot.gif')

interface ChatWelcomeScreenProps {
  assistantName?: string
  robotImageUrl?: string | null
  onGetStarted: () => void
  onMinimize: () => void
  onClose: () => void
  className?: string
}

export function ChatWelcomeScreen({
  assistantName = 'SoftKatta Mind',
  robotImageUrl,
  onGetStarted,
  onMinimize,
  onClose,
  className,
}: ChatWelcomeScreenProps) {
  const robotSrc = resolveMediaUrl(robotImageUrl) || DEFAULT_ROBOT_GIF

  return (
    <div className={cn('chatbot-welcome', className)}>
      <div className="chatbot-home__topbar chatbot-welcome__topbar">
        <button type="button" className="chatbot-home__icon-btn" aria-label="Minimize chat" onClick={onMinimize}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className="chatbot-home__icon-btn" aria-label="Close chat" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="chatbot-welcome__glow chatbot-welcome__glow--1" aria-hidden />
      <div className="chatbot-welcome__glow chatbot-welcome__glow--2" aria-hidden />

      <div className="chatbot-welcome__content">
        <h2 className="chatbot-welcome__title">
          <span className="chatbot-welcome__title-line">Meet the</span>
          <span className="chatbot-welcome__title-accent">{assistantName}!</span>
        </h2>

        <div className="chatbot-welcome__hero">
          <div className="chatbot-welcome__bubble" aria-hidden>
            Need our help now?
          </div>
          <img
            src={robotSrc}
            alt=""
            className="chatbot-welcome__robot-img"
            aria-hidden
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <button
        type="button"
        className="chatbot-welcome__cta"
        onClick={onGetStarted}
        aria-label="Get started with chat"
      >
        <span className="chatbot-welcome__cta-icon">
          <ChevronRight className="h-5 w-5" />
        </span>
        <span className="chatbot-welcome__cta-label">Get Started</span>
        <span className="chatbot-welcome__cta-arrows" aria-hidden>
          ›››
        </span>
      </button>
    </div>
  )
}
