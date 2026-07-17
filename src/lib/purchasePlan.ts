import { asBool, asNumber, asRecord, asString } from '@/lib/apiHelpers'

export type BillingCycle = 'monthly' | 'yearly' | 'enterprise'

export type ResolvedPlan = {
  productId: string
  planId: string | null
  planName: string
  price: number
  billing: BillingCycle
}

export type PlanOption = {
  id: string
  name: string
  slug: string
  price: number
  billing: BillingCycle
  isPopular: boolean
  sortOrder: number
}

function normalizeBillingCycle(value: unknown): BillingCycle | null {
  const raw = asString(value).toLowerCase()
  if (raw === 'monthly' || raw === 'yearly' || raw === 'enterprise') return raw
  return null
}

function listPlans(raw: unknown) {
  const item = asRecord(raw)
  return Array.isArray(item.plans) ? item.plans.map(asRecord) : []
}

export function activePlansForBilling(raw: unknown, billing: BillingCycle): PlanOption[] {
  return listPlans(raw)
    .filter((p) => asBool(p.is_active ?? true))
    .filter((p) => normalizeBillingCycle(p.billing_cycle) === billing)
    .map((p) => ({
      id: asString(p.id),
      name: asString(p.name),
      slug: asString(p.slug),
      price: asNumber(p.price),
      billing,
      isPopular: asBool(p.is_popular),
      sortOrder: asNumber(p.sort_order),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price)
}

/** Prefer canonical slug (monthly/yearly/enterprise), then lowest sort_order. */
export function pickDefaultPlan(plans: PlanOption[], billing?: BillingCycle): PlanOption | null {
  if (plans.length === 0) return null

  if (billing) {
    const bySlug = plans.find((p) => p.slug === billing)
    if (bySlug) return bySlug
  }

  return [...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price)[0] ?? null
}

export function getDefaultPlan(raw: unknown, billing: BillingCycle): PlanOption | null {
  return pickDefaultPlan(activePlansForBilling(raw, billing), billing)
}

export function resolvePurchaseIds(
  raw: unknown,
  billing: BillingCycle,
  preferredPlanId?: string,
): { productId: string; planId: string | null } {
  const plan = resolvePlan(raw, billing, preferredPlanId)
  return { productId: plan.productId, planId: plan.planId }
}

export function resolvePlan(
  raw: unknown,
  billing: BillingCycle,
  preferredPlanId?: string,
): ResolvedPlan {
  const record = asRecord(raw)
  const billingPlans = activePlansForBilling(raw, billing)
  const preferred = preferredPlanId
    ? billingPlans.find((p) => p.id === preferredPlanId)
    : undefined
  const matched = preferred ?? pickDefaultPlan(billingPlans, billing)

  return {
    productId: asString(record.id),
    planId: matched?.id ?? null,
    planName: matched?.name ?? '',
    price: matched?.price ?? 0,
    billing: matched?.billing ?? billing,
  }
}

export function listAllPlans(raw: unknown): PlanOption[] {
  return (['monthly', 'yearly', 'enterprise'] as const).flatMap((billing) => activePlansForBilling(raw, billing))
}

export type ProductPlanSummary = {
  monthly: PlanOption | null
  yearly: PlanOption | null
  enterprise: PlanOption | null
}

export function getProductPlanSummary(raw: unknown): ProductPlanSummary {
  return {
    monthly: getDefaultPlan(raw, 'monthly'),
    yearly: getDefaultPlan(raw, 'yearly'),
    enterprise: getDefaultPlan(raw, 'enterprise'),
  }
}

export function yearlySavingsPercent(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice <= 0 || yearlyPrice <= 0) return 0
  return Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
}

export const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  enterprise: 'Enterprise',
}

export function availableBillingCycles(summary: ProductPlanSummary): BillingCycle[] {
  return (['monthly', 'yearly', 'enterprise'] as const).filter((cycle) => summary[cycle] != null)
}

export function planForBilling(summary: ProductPlanSummary, billing: BillingCycle): PlanOption | null {
  return summary[billing]
}
