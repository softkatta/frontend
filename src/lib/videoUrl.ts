import { resolveMediaUrl } from './mediaUrl'

/** Normalize YouTube links to embed URLs for iframes. */
export function normalizeEmbedUrl(url?: string | null): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.includes('/embed/')) return trimmed

  try {
    if (trimmed.includes('youtube.com/watch')) {
      const id = new URL(trimmed).searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : trimmed
    }
    if (trimmed.includes('youtu.be/')) {
      const id = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0]
      return id ? `https://www.youtube.com/embed/${id}` : trimmed
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export function isStoredVideoPath(url?: string | null): boolean {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('uploads/')) return true
  if (trimmed.startsWith('/storage/')) return true
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(trimmed)
}

export function isEmbeddableVideo(url?: string | null): boolean {
  if (!url?.trim()) return false
  const trimmed = url.trim().toLowerCase()
  return trimmed.includes('youtube.com')
    || trimmed.includes('youtu.be')
    || trimmed.includes('vimeo.com')
}

/** Resolve demo video for display (uploaded file or external embed URL). */
export function resolveDemoVideoUrl(url?: string | null): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  if (isStoredVideoPath(trimmed)) {
    return resolveMediaUrl(trimmed)
  }
  return normalizeEmbedUrl(trimmed)
}

/** Persist demo video value from admin form (keep storage paths, normalize embed URLs). */
export function normalizeDemoVideoForSave(url?: string | null): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  if (isStoredVideoPath(trimmed)) {
    return trimmed.replace(/^\/storage\//, '').replace(/^\/+/, '')
  }
  return normalizeEmbedUrl(trimmed)
}
