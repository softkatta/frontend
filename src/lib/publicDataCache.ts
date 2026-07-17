type CacheEntry<T> = {
  data: T
  at: number
}

export function readSessionCache<T>(key: string, ttlMs: number): T | null {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - parsed.at > ttlMs) return null
    return parsed.data
  } catch {
    return null
  }
}

export function writeSessionCache<T>(key: string, data: T): void {
  if (typeof sessionStorage === 'undefined') return

  try {
    sessionStorage.setItem(key, JSON.stringify({ data, at: Date.now() } satisfies CacheEntry<T>))
  } catch {
    // Ignore quota / private mode errors.
  }
}
