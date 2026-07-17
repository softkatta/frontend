import { useCallback, useEffect, useState } from 'react'
import { chatbotApi } from '@/services/api'
import type { ChatbotPublicConfig } from '@/types/chatbot'
import { getApiErrorMessage } from '@/lib/apiHelpers'

let cachedConfig: ChatbotPublicConfig | null = null

export function clearChatbotConfigCache() {
  cachedConfig = null
}

export function useChatbotConfig(enabled = true) {
  const [config, setConfig] = useState<ChatbotPublicConfig | null>(cachedConfig)
  const [loading, setLoading] = useState(enabled && !cachedConfig)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await chatbotApi.settings()
      cachedConfig = data
      setConfig(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || cachedConfig) return
    void reload()
  }, [enabled, reload])

  return { config, loading, error, reload }
}
