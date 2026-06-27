import { getApiHostname } from '@/config/env'

/** Resolve image URLs from API (storage paths, relative, or absolute). */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''

  const trimmed = url.trim()

  const apiHost = getApiHostname().replace(/\/$/, '')

  if (apiHost) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }

    if (trimmed.startsWith('/storage/')) {
      return `${apiHost}${trimmed}`
    }

    if (trimmed.startsWith('/')) {
      return `${apiHost}${trimmed}`
    }

    return `${apiHost}/storage/${trimmed.replace(/^\/+/, '')}`
  }

  // Prefer same-origin /storage/... so Vite proxy (dev) and app origin (prod) serve files
  const storageIdx = trimmed.indexOf('/storage/')
  if (storageIdx >= 0) {
    return trimmed.slice(storageIdx)
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  return `/storage/${trimmed.replace(/^\/+/, '')}`
}

export function testimonialAvatar(name: string, avatar?: string | null, avatarUrl?: string | null): string {
  const resolved = resolveMediaUrl(avatarUrl ?? avatar)
  if (resolved) return resolved
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
}

export function defaultUserAvatar(seed = 'user'): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=4f46e5,0ea5e9&fontFamily=Helvetica`
}

export function userAvatarUrl(avatar?: string | null, seed?: string): string {
  const resolved = resolveMediaUrl(avatar)
  if (resolved) return resolved
  return defaultUserAvatar(seed?.trim() || 'user')
}
