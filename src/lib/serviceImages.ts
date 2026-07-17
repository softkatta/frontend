import { resolveMediaUrl } from '@/lib/mediaUrl'
import type { CSSProperties } from 'react'

const FALLBACKS: Record<string, { from: string; to: string; accent: string }> = {
  implementation: { from: '#dbeafe', to: '#e0e7ff', accent: '#2563eb' },
  'custom-integration': { from: '#ccfbf1', to: '#dbeafe', accent: '#0891b2' },
  training: { from: '#ede9fe', to: '#fce7f3', accent: '#6366f1' },
  default: { from: '#eef2fb', to: '#e0f2fe', accent: '#2563eb' },
}

const FALLBACK_LIST = Object.values(FALLBACKS)

export function serviceImageSrc(image?: string | null): string {
  return resolveMediaUrl(image)
}

export function serviceVisualStyle(slug: string, index = 0) {
  const key = slug.trim().toLowerCase()
  const preset = FALLBACKS[key] ?? FALLBACK_LIST[index % FALLBACK_LIST.length]
  return {
    background: `linear-gradient(145deg, ${preset.from} 0%, ${preset.to} 100%)`,
    '--svc-visual-accent': preset.accent,
  } as CSSProperties
}

export function hasServiceImage(image?: string | null): boolean {
  return Boolean(image?.trim())
}
