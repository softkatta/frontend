import { useCallback, useEffect, useMemo, useState } from 'react'

import { chatbotApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useChatbotConfig } from '@/hooks/useChatbotConfig'
import {
  getChatLanguage,
  getChatOnboarded,
  getChatOpenState,
  getChatSessionId,
  getStoredMessages,
  purgeExpiredChatStorage,
  setChatLanguage,
  setChatOnboarded,
  setChatOpenState,
  setStoredMessages,
} from '@/lib/chatbotStorage'
import type { ChatbotBotResponse, ChatbotLanguage, ChatbotMessage } from '@/types/chatbot'
import type { UserRole } from '@/types'
import { ChatButton } from './ChatButton'
import { ChatWindow } from './ChatWindow'

export type ChatbotPhase = 'welcome' | 'home' | 'chat'

function createMessage(role: 'user' | 'bot', text: string, payload?: ChatbotBotResponse): ChatbotMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    createdAt: new Date().toISOString(),
    payload,
  }
}

function resolveInitialPhase(): ChatbotPhase {
  const storedMessages = getStoredMessages<ChatbotMessage>()
  if (storedMessages.length > 0) return 'chat'
  return getChatOnboarded() ? 'home' : 'welcome'
}

function resolveVisitorName(user: { first_name?: string; last_name?: string; email: string } | null): string | undefined {
  if (!user) return undefined
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return fullName || user.email.split('@')[0]
}

export function ChatWidget() {
  const [shouldLoadConfig, setShouldLoadConfig] = useState(false)
  const { config, loading } = useChatbotConfig(shouldLoadConfig)

  useEffect(() => {
    const start = () => setShouldLoadConfig(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(start, 1500)
    return () => window.clearTimeout(timer)
  }, [])
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(getChatOpenState())
  const [minimized, setMinimized] = useState(false)
  const [phase, setPhase] = useState<ChatbotPhase>(resolveInitialPhase)
  const [messages, setMessages] = useState<ChatbotMessage[]>(() => getStoredMessages<ChatbotMessage>())
  const [latestResponse, setLatestResponse] = useState<ChatbotBotResponse | null>(null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [sessionId, setSessionId] = useState(getChatSessionId)
  const [language, setLanguage] = useState<ChatbotLanguage>(getChatLanguage)

  const position = config?.position ?? 'right'
  const userRole = isAuthenticated ? (user?.role as UserRole | undefined) : undefined
  const visitorName = isAuthenticated ? resolveVisitorName(user) : undefined

  const chatContext = useMemo(
    () => ({
      ...(userRole ? { user_role: userRole } : {}),
      ...(visitorName ? { visitor_name: visitorName } : {}),
    }),
    [userRole, visitorName],
  )

  useEffect(() => {
    const syncDailyReset = () => {
      if (!purgeExpiredChatStorage()) return
      setMessages([])
      setLatestResponse(null)
      setInput('')
      setSessionId(getChatSessionId())
      setPhase(getChatOnboarded() ? 'home' : 'welcome')
    }

    syncDailyReset()
    const timer = window.setInterval(syncDailyReset, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncDailyReset()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    setStoredMessages(messages)
  }, [messages])

  useEffect(() => {
    setChatOpenState(open)
  }, [open])

  const bootChat = useCallback(async () => {
    if (!config?.enabled) return
    setTyping(true)
    try {
      const response = await chatbotApi.sendMessage({
        session_id: sessionId,
        action: 'welcome',
        language,
        ...chatContext,
      })
      if (response.session_id) {
        localStorage.setItem('softkatta_chatbot_session_id', response.session_id)
      }
      if (response.language) {
        const lang = response.language as ChatbotLanguage
        setLanguage(lang)
        setChatLanguage(lang)
      }
      if (response.text) {
        setMessages((prev) => [...prev, createMessage('bot', response.text ?? '', response)])
      }
      setLatestResponse(response)
    } finally {
      setTyping(false)
    }
  }, [chatContext, config?.enabled, language, sessionId])

  useEffect(() => {
    if (!config?.enabled || messages.length > 0) return
    if (config.auto_open_delay > 0) {
      const timer = window.setTimeout(() => setOpen(true), config.auto_open_delay * 1000)
      return () => window.clearTimeout(timer)
    }
  }, [config, messages.length])

  const handleOpen = () => {
    setShouldLoadConfig(true)
    setOpen(true)
    setMinimized(false)
  }

  const handleGetStarted = () => {
    setChatOnboarded(true)
    setPhase('home')
  }

  const handleBackToHome = () => {
    setChatOnboarded(true)
    setPhase('home')
    setLatestResponse(null)
    setInput('')
  }

  const enterChat = useCallback(async () => {
    setPhase('chat')
    if (messages.length === 0) await bootChat()
  }, [bootChat, messages.length])

  const dispatchBot = async (payload: Parameters<typeof chatbotApi.sendMessage>[0], userLabel: string) => {
    setMessages((prev) => [...prev, createMessage('user', userLabel)])
    setLatestResponse(null)
    setTyping(true)
    try {
      const response = await chatbotApi.sendMessage({
        ...payload,
        session_id: sessionId,
        language,
        ...chatContext,
      })
      if (response.language) {
        const lang = response.language as ChatbotLanguage
        setLanguage(lang)
        setChatLanguage(lang)
      }
      if (response.text) {
        setMessages((prev) => [...prev, createMessage('bot', response.text ?? '', response)])
      }
      setLatestResponse(response)
    } finally {
      setTyping(false)
    }
  }

  const handleStartChat = () => {
    void enterChat()
  }

  const handleStartTalk = () => {
    const phone = config?.company.phone?.replace(/\s+/g, '')
    if (phone) {
      window.location.href = `tel:${phone}`
      return
    }
    void enterChat()
  }

  const handleTopic = async (key: string, label: string) => {
    setPhase('chat')
    if (messages.length === 0) await bootChat()
    await dispatchBot({ action: 'quick_reply', quick_reply: key }, label)
  }

  const handleHistorySelect = async (text: string) => {
    setPhase('chat')
    if (messages.length === 0) await bootChat()
    await dispatchBot({ action: 'message', message: text }, text)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await dispatchBot({ action: 'message', message: text }, text)
  }

  const handleQuickReply = async (key: string, label: string) => {
    await dispatchBot({ action: 'quick_reply', quick_reply: key }, label)
  }

  const handleLeadSubmit = async (values: Record<string, string>) => {
    await chatbotApi.saveLead(values)
    const confirmation = 'Thank you! Our team will contact you shortly.'
    setMessages((prev) => [...prev, createMessage('bot', confirmation)])
    setLatestResponse({
      type: 'lead_success',
      text: confirmation,
      quick_replies: config ? [] : [],
    })
  }

  const widgetReady = useMemo(() => !loading && config?.enabled, [config?.enabled, loading])

  if (!widgetReady) return null

  return (
    <div className="chatbot-widget-root">
      <ChatWindow
        open={open}
        minimized={minimized}
        phase={phase}
        config={config!}
        messages={messages}
        input={input}
        typing={typing}
        latestResponse={latestResponse}
        onGetStarted={handleGetStarted}
        onStartChat={handleStartChat}
        onStartTalk={handleStartTalk}
        onSelectTopic={handleTopic}
        onSelectHistory={handleHistorySelect}
        onViewAllTopics={handleStartChat}
        onViewAllHistory={handleStartChat}
        onInputChange={setInput}
        onSend={handleSend}
        onQuickReply={handleQuickReply}
        onLeadSubmit={handleLeadSubmit}
        onBackToHome={handleBackToHome}
        onMinimize={() => setMinimized(true)}
        onClose={() => {
          setOpen(false)
          setMinimized(false)
        }}
      />
      <ChatButton
        open={open}
        minimized={minimized}
        onClick={open && minimized ? () => setMinimized(false) : handleOpen}
        onPrime={() => setShouldLoadConfig(true)}
        position={position}
      />
    </div>
  )
}
