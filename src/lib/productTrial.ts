import type { Product } from '@/types'

export function productHasFreeTrial(product: Pick<Product, 'has_free_trial'>): boolean {
  return product.has_free_trial === true
}

export function productTrialLabel(product: Pick<Product, 'trial_days'>): string {
  const days = product.trial_days > 0 ? product.trial_days : 14
  return `${days}-day free trial`
}

export function productTrialRegisterUrl(slug: string): string {
  return `/register?redirect=${encodeURIComponent(`/products/${slug}?trial=1`)}`
}
