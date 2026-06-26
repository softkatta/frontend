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
