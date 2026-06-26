import { asBool, asNumber, asRecord, asString } from '@/lib/apiHelpers'

export type BillingCycle = 'monthly' | 'yearly'

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
  price: number
  billing: BillingCycle
  isPopular: boolean
  sortOrder: number
}

function listPlans(raw: unknown) {
  const item = asRecord(raw)
  return Array.isArray(item.plans) ? item.plans.map(asRecord) : []
}

export function activePlansForBilling(raw: unknown, billing: BillingCycle): PlanOption[] {
  return listPlans(raw)
    .filter((p) => asBool(p.is_active ?? true))
    .filter((p) => asString(p.billing_cycle) === billing)
    .map((p) => ({
      id: asString(p.id),
      name: asString(p.name),
      price: asNumber(p.price),
      billing,
      isPopular: asBool(p.is_popular),
      sortOrder: asNumber(p.sort_order),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Popular plan first, otherwise lowest sort_order. */
export function pickDefaultPlan(plans: PlanOption[]): PlanOption | null {
  if (plans.length === 0) return null
  return plans.find((p) => p.isPopular) ?? plans[0]
}

export function getDefaultPlan(raw: unknown, billing: BillingCycle): PlanOption | null {
  return pickDefaultPlan(activePlansForBilling(raw, billing))
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
  const matched = preferred ?? pickDefaultPlan(billingPlans)

  return {
    productId: asString(record.id),
    planId: matched?.id ?? null,
    planName: matched?.name ?? '',
    price: matched?.price ?? 0,
    billing: matched?.billing ?? billing,
  }
}

export function listAllPlans(raw: unknown): PlanOption[] {
  return (['monthly', 'yearly'] as const).flatMap((billing) => activePlansForBilling(raw, billing))
}
