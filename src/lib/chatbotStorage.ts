const SESSION_KEY = 'softkatta_chatbot_session_id'
const MESSAGES_KEY = 'softkatta_chatbot_messages'
const LANGUAGE_KEY = 'softkatta_chatbot_language'
const OPEN_KEY = 'softkatta_chatbot_open'
const ONBOARDED_KEY = 'softkatta_chatbot_onboarded'
const STORAGE_DAY_KEY = 'softkatta_chatbot_storage_day'

/** Local calendar day YYYY-MM-DD — chat resets when this changes. */
function todayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Clears chat messages and session when the calendar day changes.
 * Returns true if storage was reset (new day).
 */
export function purgeExpiredChatStorage(): boolean {
  if (typeof localStorage === 'undefined') return false

  const today = todayKey()
  const storedDay = localStorage.getItem(STORAGE_DAY_KEY)

  if (storedDay === today) return false

  localStorage.removeItem(MESSAGES_KEY)
  localStorage.removeItem(SESSION_KEY)
  localStorage.setItem(STORAGE_DAY_KEY, today)

  return true
}

export function getChatSessionId(): string {
  purgeExpiredChatStorage()
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

export function getChatLanguage(): 'en' | 'mr' | 'hi' {
  const lang = localStorage.getItem(LANGUAGE_KEY)
  return lang === 'mr' || lang === 'hi' ? lang : 'en'
}

export function setChatLanguage(language: 'en' | 'mr' | 'hi') {
  localStorage.setItem(LANGUAGE_KEY, language)
}

export function getStoredMessages<T>(): T[] {
  purgeExpiredChatStorage()
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function setStoredMessages<T>(messages: T[]) {
  purgeExpiredChatStorage()
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-100)))
}

export function getChatOpenState(): boolean {
  return localStorage.getItem(OPEN_KEY) === '1'
}

export function setChatOpenState(open: boolean) {
  localStorage.setItem(OPEN_KEY, open ? '1' : '0')
}

export function getChatOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

export function setChatOnboarded(onboarded: boolean) {
  localStorage.setItem(ONBOARDED_KEY, onboarded ? '1' : '0')
}

export function clearChatStorage() {
  localStorage.removeItem(MESSAGES_KEY)
  localStorage.removeItem(SESSION_KEY)
}
