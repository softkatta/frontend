export type OfferGradientColors = {
  from: string
  via: string
  to: string
}

export const DEFAULT_OFFER_GRADIENT: OfferGradientColors = {
  from: '#2962ff',
  via: '#6366f1',
  to: '#14b8a6',
}

export const OFFER_GRADIENT_PRESETS: { id: string; label: string; colors: OfferGradientColors }[] = [
  { id: 'brand', label: 'Brand Blue → Teal', colors: DEFAULT_OFFER_GRADIENT },
  { id: 'ocean', label: 'Ocean', colors: { from: '#0ea5e9', via: '#2563eb', to: '#1e40af' } },
  { id: 'sunset', label: 'Sunset', colors: { from: '#f97316', via: '#ec4899', to: '#8b5cf6' } },
  { id: 'forest', label: 'Forest', colors: { from: '#22c55e', via: '#14b8a6', to: '#0891b2' } },
  { id: 'royal', label: 'Royal', colors: { from: '#7c3aed', via: '#6366f1', to: '#2563eb' } },
  { id: 'gold', label: 'Gold', colors: { from: '#f59e0b', via: '#f97316', to: '#dc2626' } },
]

function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  return fallback
}

function parseLegacyTailwind(raw: string): OfferGradientColors | null {
  const from = raw.match(/from-\[#([0-9a-fA-F]{6})\]/i)?.[1]
  const via = raw.match(/via-\[#([0-9a-fA-F]{6})\]/i)?.[1]
  const to = raw.match(/to-\[#([0-9a-fA-F]{6})\]/i)?.[1]
  if (!from && !via && !to) return null

  return {
    from: normalizeHex(from ? `#${from}` : '', DEFAULT_OFFER_GRADIENT.from),
    via: normalizeHex(via ? `#${via}` : '', DEFAULT_OFFER_GRADIENT.via),
    to: normalizeHex(to ? `#${to}` : '', DEFAULT_OFFER_GRADIENT.to),
  }
}

export function parseOfferGradient(raw?: string): OfferGradientColors {
  if (!raw?.trim()) return DEFAULT_OFFER_GRADIENT

  try {
    const parsed = JSON.parse(raw) as Partial<OfferGradientColors>
    if (parsed && typeof parsed === 'object' && (parsed.from || parsed.via || parsed.to)) {
      return {
        from: normalizeHex(parsed.from ?? '', DEFAULT_OFFER_GRADIENT.from),
        via: normalizeHex(parsed.via ?? '', DEFAULT_OFFER_GRADIENT.via),
        to: normalizeHex(parsed.to ?? '', DEFAULT_OFFER_GRADIENT.to),
      }
    }
  } catch {
    // Fall through to legacy formats.
  }

  const legacy = parseLegacyTailwind(raw)
  if (legacy) return legacy

  const compact = raw.match(/from:([^,]+),via:([^,]+),to:(.+)/i)
  if (compact) {
    return {
      from: normalizeHex(compact[1], DEFAULT_OFFER_GRADIENT.from),
      via: normalizeHex(compact[2], DEFAULT_OFFER_GRADIENT.via),
      to: normalizeHex(compact[3], DEFAULT_OFFER_GRADIENT.to),
    }
  }

  return DEFAULT_OFFER_GRADIENT
}

export function serializeOfferGradient(colors: OfferGradientColors): string {
  return JSON.stringify({
    from: normalizeHex(colors.from, DEFAULT_OFFER_GRADIENT.from),
    via: normalizeHex(colors.via, DEFAULT_OFFER_GRADIENT.via),
    to: normalizeHex(colors.to, DEFAULT_OFFER_GRADIENT.to),
  })
}

export function offerGradientToCss(colors: OfferGradientColors): string {
  const from = normalizeHex(colors.from, DEFAULT_OFFER_GRADIENT.from)
  const via = normalizeHex(colors.via, DEFAULT_OFFER_GRADIENT.via)
  const to = normalizeHex(colors.to, DEFAULT_OFFER_GRADIENT.to)
  return `linear-gradient(90deg, ${from} 0%, ${via} 50%, ${to} 100%)`
}
