import type {
  ChatbotBotResponse,
  ChatbotLeadFormValues,
  ChatbotPublicConfig,
} from '@/types/chatbot'
import { api } from '../wrapper'

export const chatbotApi = {
  settings: () => api.get<ChatbotPublicConfig>('/chatbot/settings', { skipAuth: true }),
  quickReplies: () => api.get<unknown>('/chatbot/quick-replies', { skipAuth: true }),
  sendMessage: (payload: {
    session_id?: string
    message?: string
    action?: 'welcome' | 'message' | 'quick_reply'
    quick_reply?: string
    language?: string
    visitor_name?: string
    category?: string
    user_role?: 'admin' | 'employee' | 'client' | 'hr'
  }) => api.post<ChatbotBotResponse>('/chatbot/message', payload, { skipAuth: true }),
  searchFaq: (payload: { query: string; language?: string; category?: string; limit?: number; user_role?: string }) =>
    api.post<{ matches: unknown[] }>('/chatbot/search', payload, { skipAuth: true }),
  saveConversation: (payload: {
    session_id: string
    visitor_name?: string
    message: string
    response?: string
    language?: string
  }) => api.post<unknown>('/chatbot/conversations', payload, { skipAuth: true }),
  saveLead: (payload: Partial<ChatbotLeadFormValues> & { recaptcha_token?: string }) =>
    api.post<unknown>('/chatbot/leads', payload, { skipAuth: true }),
}
