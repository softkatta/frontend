import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { websiteHref } from '@/lib/companyContact'

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'whatsapp'

export type SocialLinks = Partial<Record<SocialPlatform, string>>

type IconProps = SVGProps<SVGSVGElement>

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
    </svg>
  )
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Z" />
      <path d="M17.5 6.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
      <path d="M12 3.5c2.2 0 2.5 0 3.4.1.9.1 1.4.2 1.8.4.5.2.9.4 1.3.8.4.4.6.8.8 1.3.2.4.3.9.4 1.8.1.9.1 1.2.1 3.4s0 2.5-.1 3.4c-.1.9-.2 1.4-.4 1.8-.2.5-.4.9-.8 1.3-.4.4-.8.6-1.3.8-.4.2-.9.3-1.8.4-.9.1-1.2.1-3.4.1s-2.5 0-3.4-.1c-.9-.1-1.4-.2-1.8-.4-.5-.2-.9-.4-1.3-.8-.4-.4-.6-.8-.8-1.3-.2-.4-.3-.9-.4-1.8-.1-.9-.1-1.2-.1-3.4s0-2.5.1-3.4c.1-.9.2-1.4.4-1.8.2-.5.4-.9.8-1.3.4-.4.8-.6 1.3-.8.4-.2.9-.3 1.8-.4.9-.1 1.2-.1 3.4-.1Zm0-1.5c-2.3 0-2.5 0-3.5.1-1 .1-1.7.2-2.3.5-.6.2-1.2.6-1.7 1.1S3.4 5.4 3.2 6c-.3.6-.4 1.3-.5 2.3-.1 1-.1 1.2-.1 3.5s0 2.5.1 3.5c.1 1 .2 1.7.5 2.3.2.6.6 1.2 1.1 1.7s1.1.8 1.7 1.1c.6.3 1.3.4 2.3.5 1 .1 1.2.1 3.5.1s2.5 0 3.5-.1c1-.1 1.7-.2 2.3-.5.6-.2 1.2-.6 1.7-1.1s.8-1.1 1.1-1.7c.3-.6.4-1.3.5-2.3.1-1 .1-1.2.1-3.5s0-2.5-.1-3.5c-.1-1-.2-1.7-.5-2.3-.2-.6-.6-1.2-1.1-1.7s-1.1-.8-1.7-1.1c-.6-.3-1.3-.4-2.3-.5-1-.1-1.2-.1-3.5-.1Z" />
    </svg>
  )
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M6.9 8.7H4.1V20h2.8V8.7ZM5.5 4A1.7 1.7 0 1 0 5.5 7.4 1.7 1.7 0 0 0 5.5 4ZM20 20h-2.8v-5.9c0-1.6-.6-2.6-2-2.6-1.1 0-1.7.7-2 1.4-.1.3-.1.6-.1.9V20H10.3s0-9.7 0-10.7h2.8v1.7c.5-.8 1.7-2 3.9-2 2.7 0 4.7 1.8 4.7 5.6V20Z" />
    </svg>
  )
}

function TwitterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.2 3H21l-6.5 7.4L22 21h-5.8l-4.5-5.9L6.4 21H3.6l7-7.9L2 3h6l4.1 5.4L18.2 3Zm-1 16.2h1.6L7 4.7H5.3l11.9 14.5Z" />
    </svg>
  )
}

function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22.5 7.2a3 3 0 0 0-2.1-2.1C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.4.5A3 3 0 0 0 1.5 7.2 31.5 31.5 0 0 0 1 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.7.5 8.4.5 8.4.5s6.7 0 8.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 23 12a31.5 31.5 0 0 0-.5-4.8ZM9.8 15.5v-7L16 12l-6.2 3.5Z" />
    </svg>
  )
}

function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.1 4.9A9.9 9.9 0 0 0 3.3 17.1L2 22l5-1.3A9.9 9.9 0 0 0 19.1 4.9Zm-7.1 15.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 6.9 3.7Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  )
}

const SOCIAL_META: Array<{
  key: SocialPlatform
  label: string
  Icon: ComponentType<IconProps>
}> = [
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedinIcon },
  { key: 'twitter', label: 'X / Twitter', Icon: TwitterIcon },
  { key: 'youtube', label: 'YouTube', Icon: YoutubeIcon },
  { key: 'whatsapp', label: 'WhatsApp', Icon: WhatsappIcon },
]

function normalizeSocialHref(platform: SocialPlatform, value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (platform === 'whatsapp') {
    if (trimmed.startsWith('http')) return trimmed
    const digits = trimmed.replace(/\D+/g, '')
    return digits ? `https://wa.me/${digits}` : undefined
  }

  return websiteHref(trimmed)
}

export function getActiveSocialLinks(links: SocialLinks) {
  return SOCIAL_META
    .map((item) => {
      const href = normalizeSocialHref(item.key, links[item.key] ?? '')
      if (!href) return null
      return { ...item, href }
    })
    .filter(Boolean) as Array<{
      key: SocialPlatform
      label: string
      href: string
      Icon: ComponentType<IconProps>
    }>
}

export function SocialMediaLinks({
  links,
  className,
  buttonClassName,
  title = 'Follow us',
}: {
  links: SocialLinks
  className?: string
  buttonClassName?: string
  title?: string
}) {
  const items = getActiveSocialLinks(links)
  if (items.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      {title ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {title}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {items.map(({ key, label, href, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={cn('site-footer-social', buttonClassName)}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  )
}
