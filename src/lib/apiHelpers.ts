
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>

  if (Array.isArray(record.data)) return record.data as T[]

  // Nested paginator / double-wrapped API payloads
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const inner = record.data as Record<string, unknown>
    if ('data' in inner || 'items' in inner || 'current_page' in inner) {
      return unwrapList<T>(record.data)
    }
  }

  if (Array.isArray(record.items)) return record.items as T[]

  return []
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export function unwrapPaginated<T>(payload: unknown): { items: T[]; meta: PaginationMeta } {
  const items = unwrapList<T>(payload)

  let source = asRecord(unwrapPayload(payload))
  if (!('current_page' in source) && source.data && typeof source.data === 'object') {
    source = asRecord(source.data)
  }

  const root = asRecord(payload)
  if (!('current_page' in source) && root.data && typeof root.data === 'object') {
    source = asRecord(root.data)
  }

  return {
    items,
    meta: {
      current_page: asNumber(source.current_page, 1),
      last_page: asNumber(source.last_page, 1),
      per_page: asNumber(source.per_page, items.length || 15),
      total: asNumber(source.total, items.length),
    },
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')

  const cleanup = () => {
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      iframe.remove()
    }, 1000)
  }

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    cleanup()
  }

  iframe.src = url
  document.body.appendChild(iframe)
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const messages = collectApiErrorMessages(error)
  if (messages.length > 0) return messages.join(' ')
  return fallback
}

function collectApiErrorMessages(error: unknown): string[] {
  if (error && typeof error === 'object') {
    if ('errors' in error && typeof (error as { errors?: unknown }).errors === 'object' && (error as { errors?: unknown }).errors !== null) {
      const fieldErrors = (error as { errors: Record<string, unknown> }).errors
      const messages = Object.values(fieldErrors).flatMap((value) => {
        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
        }
        if (typeof value === 'string' && value.trim() !== '') return [value]
        return []
      })
      if (messages.length > 0) return messages
    }

    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      const message = (error as { message: string }).message
      if (message && message !== 'Rejected') return [message]
    }
    if ('error' in error && (error as { error: unknown }).error) {
      return collectApiErrorMessages((error as { error: unknown }).error)
    }
  }

  if (error instanceof Error && error.message) {
    return [error.message]
  }

  return []
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

/** Unwrap nested `{ data: ... }` API payloads (single or double wrapped). */
export function unwrapPayload<T = Record<string, unknown>>(payload: unknown): T {
  let current: unknown = payload

  for (let depth = 0; depth < 3; depth += 1) {
    const record = asRecord(current)

    if ('catalog' in record || 'roles' in record) {
      break
    }

    if (record.data != null && typeof record.data === 'object') {
      current = record.data
      continue
    }

    break
  }

  return asRecord(current) as T
}

export function asString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value)
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function asBool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}
