import { Send } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ChatbotBotResponse, ChatbotMessage, ChatbotPublicConfig } from '@/types/chatbot'

import type { ChatbotPhase } from './ChatWidget'

import { ChatHomeScreen } from './ChatHomeScreen'

import { ChatWindowHeader } from './ChatButton'

import { ChatWelcomeScreen } from './ChatWelcomeScreen'

import { ConversationHistory } from './ConversationHistory'



interface ChatWindowProps {

  open: boolean

  minimized: boolean

  phase: ChatbotPhase

  config: ChatbotPublicConfig

  messages: ChatbotMessage[]

  input: string

  typing: boolean

  latestResponse: ChatbotBotResponse | null

  onGetStarted: () => void

  onStartChat: () => void

  onStartTalk: () => void

  onSelectTopic: (key: string, label: string) => void

  onSelectHistory: (text: string) => void

  onViewAllTopics: () => void

  onViewAllHistory: () => void

  onInputChange: (value: string) => void

  onSend: () => void

  onQuickReply: (key: string, label: string) => void

  onLeadSubmit: (values: Record<string, string>) => Promise<void>

  onBackToHome: () => void

  onMinimize: () => void

  onClose: () => void

}



export function ChatWindow({

  open,

  minimized,

  phase,

  config,

  messages,

  input,

  typing,

  latestResponse,

  onGetStarted,

  onStartChat,

  onStartTalk,

  onSelectTopic,

  onSelectHistory,

  onViewAllTopics,

  onViewAllHistory,

  onInputChange,

  onSend,

  onQuickReply,

  onLeadSubmit,

  onBackToHome,

  onMinimize,

  onClose,

}: ChatWindowProps) {

  if (!open || minimized) return null



  const isHub = phase === 'welcome' || phase === 'home'



  return (

    <div

      className={cn(

        'chatbot-window',

        isHub && 'chatbot-window--hub',

        phase === 'welcome' && 'chatbot-window--welcome',

        config.position === 'left' ? 'chatbot-window--left' : 'chatbot-window--right',

      )}

    >

      <span className="chatbot-window__orb chatbot-window__orb--1" aria-hidden />

      <span className="chatbot-window__orb chatbot-window__orb--2" aria-hidden />



      {phase === 'chat' ? (

        <ChatWindowHeader

          title={config.company.name || 'SoftKatta Solutions'}

          onBackToHome={onBackToHome}

          onMinimize={onMinimize}

          onClose={onClose}

        />

      ) : null}



      {phase === 'welcome' ? (

        <ChatWelcomeScreen
          robotImageUrl={config.welcome_robot_url}
          onGetStarted={onGetStarted}
          onMinimize={onMinimize}
          onClose={onClose}
        />

      ) : null}



      {phase === 'home' ? (

        <ChatHomeScreen

          phone={config.company.phone}

          history={messages}

          onStartChat={onStartChat}

          onStartTalk={onStartTalk}

          onSelectTopic={onSelectTopic}

          onSelectHistory={onSelectHistory}

          onViewAllTopics={onViewAllTopics}

          onViewAllHistory={onViewAllHistory}

          onMinimize={onMinimize}

          onClose={onClose}

        />

      ) : null}



      {phase === 'chat' ? (

        <>

          <ConversationHistory

            messages={messages}

            typing={typing}

            latestResponse={latestResponse}

            onQuickReply={onQuickReply}

            onLeadSubmit={onLeadSubmit}

          />



          <form

            className="chatbot-window__composer"

            onSubmit={(event) => {

              event.preventDefault()

              onSend()

            }}

          >

            <div className="chatbot-window__composer-inner">

              <input

                className="chatbot-window__input"

                value={input}

                onChange={(e) => onInputChange(e.target.value)}

                placeholder="Ask about products, pricing, demo…"

                aria-label="Chat message"

              />

              <button

                type="submit"

                className="chatbot-window__send"

                aria-label="Send message"

                disabled={!input.trim()}

              >

                <Send className="h-4 w-4" />

              </button>

            </div>

          </form>

        </>

      ) : null}

    </div>

  )

}


