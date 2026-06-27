
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
  if (error && typeof error === 'object') {
    if ('errors' in error && typeof (error as { errors?: unknown }).errors === 'object' && (error as { errors?: unknown }).errors !== null) {
      const fieldErrors = (error as { errors: Record<string, unknown> }).errors
      const first = Object.values(fieldErrors)[0]
      if (Array.isArray(first) && typeof first[0] === 'string' && first[0].trim() !== '') {
        return first[0]
      }
      if (typeof first === 'string' && first.trim() !== '') {
        return first
      }
    }

    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      const message = (error as { message: string }).message
      if (message && message !== 'Rejected') return message
    }
    if ('error' in error && (error as { error: unknown }).error) {
      return getApiErrorMessage((error as { error: unknown }).error, fallback)
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
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
