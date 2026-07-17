export type ChatbotLanguage = 'en' | 'mr' | 'hi'

export interface ChatbotCompanyInfo {
  name: string
  phone: string
  email: string
  website: string
  address: string
}

export interface ChatbotPublicConfig {
  enabled: boolean
  welcome_message: string
  welcome_robot_url?: string
  theme_color: string
  position: 'left' | 'right'
  auto_open_delay: number
  file_upload_enabled: boolean
  business_hours: string
  company: ChatbotCompanyInfo
}

export interface ChatbotQuickReply {
  key: string
  label: string
}

export interface ChatbotMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  createdAt: string
  payload?: ChatbotBotResponse
}

export interface ChatbotBotResponse {
  type: string
  text?: string
  session_id?: string
  quick_replies?: ChatbotQuickReply[]
  language_options?: ChatbotQuickReply[]
  items?: string[]
  contact?: ChatbotCompanyInfo
  actions?: Array<{ type: string; label: string; href: string }>
  form?: string
  fields?: string[]
  matches?: Array<{ id: number; question: string; answer: string }>
  faq?: { id: number; question: string; answer: string }
  language?: ChatbotLanguage
}

export interface ChatbotFaq {
  id: number | string
  question: string
  answer: string
  keywords?: string | null
  language: ChatbotLanguage | string
  category?: string | null
  sort_order: number
  is_active: boolean
}

export interface ChatbotCategory {
  id: number | string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export interface ChatbotLead {
  id: number | string
  name?: string | null
  phone?: string | null
  email?: string | null
  company_name?: string | null
  product?: string | null
  message?: string | null
  status: 'new' | 'contacted' | 'converted' | 'closed'
  assigned_to?: number | string | null
  created_at?: string
}

export interface ChatbotConversation {
  id: number | string
  session_id: string
  visitor_name?: string | null
  message: string
  response?: string | null
  language?: string
  created_at?: string
}

export interface ChatbotSettings extends Record<string, unknown> {
  enabled: boolean
  welcome_message: string
  welcome_robot_image?: string
  welcome_robot_url?: string
  theme_color: string
  position: 'left' | 'right'
  auto_open_delay: number
  file_upload_enabled: boolean
  business_hours: string
  company_name: string
  company_phone: string
  company_email: string
  company_website: string
  company_address: string
}

export interface ChatbotDashboardStats {
  total_conversations: number
  total_leads: number
  conversion_rate: number
  most_asked_questions: Array<{ message: string; count: number }>
  daily_chats: Array<{ date: string; count: number }>
  recent_conversations: ChatbotConversation[]
}

export interface ChatbotAnalytics {
  daily_conversations: Array<{ date: string; count: number }>
  top_questions: Array<{ message: string; count: number }>
  lead_conversion: Array<{ status: string; count: number }>
  device_statistics: Array<{ device: string; count: number }>
  language_statistics: Array<{ language: string; count: number }>
}

export type ChatbotLeadFormType = 'book_demo' | 'technical_support'

export interface ChatbotLeadFormValues {
  name: string
  phone: string
  email: string
  company_name: string
  product: string
  preferred_datetime: string
  message: string
}
