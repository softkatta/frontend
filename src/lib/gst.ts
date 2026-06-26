export const DEFAULT_GST_RATE = 18

export function normalizeGstRate(rate: unknown): number {
  const value = Number(rate)
  if (!Number.isFinite(value) || value < 0) return DEFAULT_GST_RATE
  return Math.min(100, value)
}

export function calculateGstAmount(subtotal: number, rate: number): number {
  return Math.round(subtotal * (normalizeGstRate(rate) / 100))
}

export function formatGstLabel(rate: number): string {
  const normalized = normalizeGstRate(rate)
  return Number.isInteger(normalized) ? `${normalized}%` : `${normalized}%`
}
