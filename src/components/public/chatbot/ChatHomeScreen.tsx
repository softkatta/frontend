import {
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  Headphones,
  KeyRound,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Mic,
  Minus,
  Package,
  ShoppingCart,
  TrendingUp,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getPortalRoleLabel, getPortalTopics, type PortalTopic, type PortalTopicIcon } from '@/lib/chatbotPortalTopics'
import { cn } from '@/lib/utils'
import type { ChatbotMessage } from '@/types/chatbot'

export interface ChatHomeTopic {
  key: string
  label: string
  icon: 'products' | 'pricing' | 'demo' | 'contact' | 'support' | 'faq' | 'careers'
}

interface ChatHomeScreenProps {
  assistantName?: string
  phone?: string
  history: ChatbotMessage[]
  onStartChat: () => void
  onStartTalk: () => void
  onSelectTopic: (key: string, label: string) => void
  onSelectHistory: (text: string) => void
  onViewAllTopics: () => void
  onViewAllHistory: () => void
  onMinimize: () => void
  onClose: () => void
  className?: string
}

const PUBLIC_TOPICS: ChatHomeTopic[] = [
  { key: 'products', label: 'Products', icon: 'products' },
  { key: 'pricing', label: 'Pricing', icon: 'pricing' },
  { key: 'book_demo', label: 'Book Demo', icon: 'demo' },
  { key: 'contact', label: 'Contact', icon: 'contact' },
  { key: 'support', label: 'Support', icon: 'support' },
  { key: 'faq', label: 'FAQ', icon: 'faq' },
  { key: 'careers', label: 'Careers', icon: 'careers' },
]

function TopicIcon({ icon }: { icon: ChatHomeTopic['icon'] }) {
  switch (icon) {
    case 'products':
      return <Package className="h-5 w-5" />
    case 'pricing':
      return <TrendingUp className="h-5 w-5" />
    case 'demo':
      return <CalendarCheck className="h-5 w-5" />
    case 'support':
      return <Headphones className="h-5 w-5" />
    case 'faq':
      return <CircleHelp className="h-5 w-5" />
    case 'careers':
      return <Briefcase className="h-5 w-5" />
    default:
      return <Building2 className="h-5 w-5" />
  }
}

function PortalTopicIcon({ icon }: { icon: PortalTopicIcon }) {
  switch (icon) {
    case 'attendance':
      return <ClipboardList className="h-5 w-5" />
    case 'tasks':
      return <ListTodo className="h-5 w-5" />
    case 'leave':
      return <CalendarCheck className="h-5 w-5" />
    case 'documents':
      return <FileText className="h-5 w-5" />
    case 'timesheets':
      return <ClipboardList className="h-5 w-5" />
    case 'helpdesk':
      return <Headphones className="h-5 w-5" />
    case 'orders':
      return <ShoppingCart className="h-5 w-5" />
    case 'subscriptions':
      return <CreditCard className="h-5 w-5" />
    case 'invoices':
      return <FileText className="h-5 w-5" />
    case 'licenses':
      return <KeyRound className="h-5 w-5" />
    case 'support':
      return <Headphones className="h-5 w-5" />
    case 'users':
      return <UserCog className="h-5 w-5" />
    case 'products':
      return <Package className="h-5 w-5" />
    case 'notifications':
      return <Bell className="h-5 w-5" />
    case 'employees':
      return <Users className="h-5 w-5" />
    case 'applications':
      return <Briefcase className="h-5 w-5" />
    case 'portal_help':
      return <CircleHelp className="h-5 w-5" />
    default:
      return <CircleHelp className="h-5 w-5" />
  }
}

function formatHistoryDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getUserInitials(firstName?: string, lastName?: string, email?: string) {
  const first = firstName?.trim()?.[0] ?? ''
  const last = lastName?.trim()?.[0] ?? ''
  if (first || last) return `${first}${last}`.toUpperCase()
  return email?.trim()?.[0]?.toUpperCase() ?? 'U'
}

function renderTopicGrid(
  topics: Array<ChatHomeTopic | PortalTopic>,
  onSelectTopic: (key: string, label: string) => void,
  variant: 'public' | 'portal',
) {
  return (
    <div className="chatbot-home__topics">
      {topics.map((topic) => (
        <button
          key={topic.key}
          type="button"
          className={cn('chatbot-home__topic', variant === 'portal' && 'chatbot-home__topic--portal')}
          onClick={() => onSelectTopic(topic.key, topic.label)}
        >
          <span className="chatbot-home__topic-icon">
            {variant === 'portal' ? (
              <PortalTopicIcon icon={(topic as PortalTopic).icon} />
            ) : (
              <TopicIcon icon={(topic as ChatHomeTopic).icon} />
            )}
          </span>
          <span className="chatbot-home__topic-label">{topic.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ChatHomeScreen({
  assistantName = 'SoftKatta Mind',
  phone,
  history,
  onStartChat,
  onStartTalk,
  onSelectTopic,
  onSelectHistory,
  onViewAllTopics,
  onViewAllHistory,
  onMinimize,
  onClose,
  className,
}: ChatHomeScreenProps) {
  const { user, isAuthenticated } = useAuth()

  const displayName = useMemo(() => {
    if (!isAuthenticated || !user) return null
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    if (fullName) return fullName
    return user.email.split('@')[0] ?? null
  }, [isAuthenticated, user])

  const avatarLabel = useMemo(
    () => getUserInitials(user?.first_name, user?.last_name, user?.email),
    [user?.email, user?.first_name, user?.last_name],
  )

  const portalTopics = useMemo(() => getPortalTopics(isAuthenticated ? user?.role : null), [isAuthenticated, user?.role])
  const portalRoleLabel = useMemo(() => getPortalRoleLabel(isAuthenticated ? user?.role : null), [isAuthenticated, user?.role])

  const historyItems = history
    .filter((message) => message.role === 'user')
    .slice(-4)
    .reverse()

  return (
    <div className={cn('chatbot-home', className)}>
      <div className="chatbot-home__topbar">
        <button type="button" className="chatbot-home__icon-btn" aria-label="Minimize chat" onClick={onMinimize}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className="chatbot-home__icon-btn" aria-label="Close chat" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="chatbot-home__scroll">
        <header className="chatbot-home__header">
          <div className="chatbot-home__profile">
            <div className={cn('chatbot-home__avatar', displayName && 'chatbot-home__avatar--user')}>
              {displayName ? (
                <span className="chatbot-home__avatar-initials">{avatarLabel}</span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="chatbot-home__greeting">{displayName ? 'Welcome back' : 'Hello there!'}</p>
              <p className="chatbot-home__name">{displayName ? `${displayName}!` : 'Welcome to SoftKatta'}</p>
              {portalRoleLabel ? (
                <p className="chatbot-home__role-badge">{portalRoleLabel} portal</p>
              ) : null}
            </div>
          </div>
          <button type="button" className="chatbot-home__icon-btn chatbot-home__icon-btn--round" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
        </header>

        <div className="chatbot-home__actions">
          <button type="button" className="chatbot-home__action-tile" onClick={onStartChat}>
            <span className="chatbot-home__action-icon">
              <MessageCircle className="h-6 w-6" />
            </span>
            <span className="chatbot-home__action-label">
              Chat with
              <strong>{assistantName}</strong>
            </span>
          </button>
          <button type="button" className="chatbot-home__action-tile" onClick={onStartTalk}>
            <span className="chatbot-home__action-icon">
              <Mic className="h-6 w-6" />
            </span>
            <span className="chatbot-home__action-label">
              Talk with
              <strong>{assistantName}</strong>
            </span>
            {phone ? <span className="chatbot-home__action-hint">{phone}</span> : null}
          </button>
        </div>

        {portalTopics.length > 0 ? (
          <section className="chatbot-home__section">
            <div className="chatbot-home__section-head">
              <h3>{portalRoleLabel} Portal Help</h3>
              <button
                type="button"
                className="chatbot-home__view-all"
                onClick={() => onSelectTopic(`portal:${user?.role}:help`, 'All portal help')}
              >
                View All
              </button>
            </div>
            {renderTopicGrid(portalTopics, onSelectTopic, 'portal')}
          </section>
        ) : null}

        <section className="chatbot-home__section">
          <div className="chatbot-home__section-head">
            <h3>{portalTopics.length > 0 ? 'Website Topics' : 'Topics'}</h3>
            <button type="button" className="chatbot-home__view-all" onClick={onViewAllTopics}>
              View All
            </button>
          </div>
          {renderTopicGrid(PUBLIC_TOPICS, onSelectTopic, 'public')}
        </section>

        <section className="chatbot-home__section">
          <div className="chatbot-home__section-head">
            <h3>History</h3>
            <button type="button" className="chatbot-home__view-all" onClick={onViewAllHistory}>
              View All
            </button>
          </div>
          <div className="chatbot-home__history">
            {historyItems.length === 0 ? (
              <div className="chatbot-home__history-empty chatbot-float-card">
                No chats yet. Start a conversation to see history here.
              </div>
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chatbot-home__history-item chatbot-float-card"
                  onClick={() => onSelectHistory(item.text)}
                >
                  <span className="chatbot-home__history-icon">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <span className="chatbot-home__history-copy">
                    <strong>{item.text}</strong>
                    <span>{formatHistoryDate(item.createdAt)}</span>
                  </span>
                  <ChevronRight className="chatbot-home__history-chevron h-4 w-4" aria-hidden />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
