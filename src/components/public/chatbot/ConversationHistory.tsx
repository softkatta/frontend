import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { ChatbotBotResponse, ChatbotMessage, ChatbotQuickReply } from '@/types/chatbot'
import { MessageBubble } from './MessageBubble'
import { QuickReplyButtons } from './QuickReplyButtons'
import { LeadForm } from './LeadForm'
import { TypingIndicator } from './TypingIndicator'

interface ConversationHistoryProps {
  messages: ChatbotMessage[]
  typing: boolean
  latestResponse?: ChatbotBotResponse | null
  onQuickReply: (key: string, label: string) => void
  onLeadSubmit: (values: Record<string, string>) => Promise<void>
}

export function ConversationHistory({
  messages,
  typing,
  latestResponse,
  onQuickReply,
  onLeadSubmit,
}: ConversationHistoryProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, latestResponse])

  return (
    <div className="chatbot-history">
      {messages.map((message) => (
        <MessageBubble key={message.id} role={message.role} text={message.text} />
      ))}

      {latestResponse?.items?.length ? (
        <div className="chatbot-card-list">
          {latestResponse.items.map((item) => (
            <div key={item} className="chatbot-card-list__item chatbot-float-card">{item}</div>
          ))}
        </div>
      ) : null}

      {latestResponse?.contact ? (
        <div className="chatbot-contact-card chatbot-float-card">
          <p><strong>{latestResponse.contact.name}</strong></p>
          <p>{latestResponse.contact.phone}</p>
          <p>{latestResponse.contact.email}</p>
          <p>{latestResponse.contact.website}</p>
          <p>{latestResponse.contact.address}</p>
        </div>
      ) : null}

      {latestResponse?.matches?.length ? (
        <div className="chatbot-faq-matches">
          {latestResponse.matches.map((match) => (
            <button
              key={match.id}
              type="button"
              className="chatbot-faq-matches__item chatbot-float-card"
              onClick={() => onQuickReply(`faq:${match.id}`, match.question)}
            >
              <strong>{match.question}</strong>
              <span>{match.answer}</span>
            </button>
          ))}
        </div>
      ) : null}

      {latestResponse?.form && latestResponse.fields ? (
        <div className="chatbot-lead-panel">
          <LeadForm
            formType={latestResponse.form as 'book_demo' | 'technical_support'}
            fields={latestResponse.fields}
            onSubmit={onLeadSubmit}
          />
        </div>
      ) : null}

      {latestResponse?.actions?.map((action) => (
        action.type === 'link' ? (
          <Link key={action.href} to={action.href} className="chatbot-action-link">
            {action.label}
          </Link>
        ) : null
      ))}

      {latestResponse?.quick_replies?.length ? (
        <QuickReplyButtons
          items={latestResponse.quick_replies as ChatbotQuickReply[]}
          onSelect={onQuickReply}
        />
      ) : null}

      {latestResponse?.language_options?.length ? (
        <QuickReplyButtons
          items={latestResponse.language_options as ChatbotQuickReply[]}
          onSelect={onQuickReply}
          className="chatbot-quick-replies--languages"
        />
      ) : null}

      {typing ? <TypingIndicator /> : null}
      <div ref={endRef} />
    </div>
  )
}
