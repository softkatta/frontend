import { adminApi } from '@/services/api'
import { asRecord, asString } from '@/lib/apiHelpers'
import type { PlanFormValues } from '@/components/admin/PlanFormDialog'

type ExistingPlan = {
  id: string
  product_id: string
  billing_cycle: string
}

const CYCLES = [
  { billing_cycle: 'monthly' as const, name: 'Monthly', sort_order: 0, key: 'price_monthly' as const },
  { billing_cycle: 'yearly' as const, name: 'Yearly', sort_order: 1, key: 'price_yearly' as const },
  { billing_cycle: 'enterprise' as const, name: 'Enterprise', sort_order: 2, key: 'price_enterprise' as const },
]

function sameProductId(a: string | number, b: string | number): boolean {
  return String(a) === String(b)
}

export async function saveProductPlans(values: PlanFormValues, existingPlans: ExistingPlan[]) {
  const forProduct = existingPlans.filter((p) => sameProductId(p.product_id, values.product_id))
  const keptIds = new Set<string>()

  for (const cycle of CYCLES) {
    const price = values[cycle.key]
    const existing = forProduct.find((p) => p.billing_cycle === cycle.billing_cycle)

    if (price > 0) {
      const payload = {
        product_id: Number(values.product_id),
        name: cycle.name,
        slug: cycle.billing_cycle,
        description: values.description || undefined,
        price,
        billing_cycle: cycle.billing_cycle,
        is_active: values.is_active,
        is_popular: values.is_popular && cycle.billing_cycle === 'monthly',
        sort_order: cycle.sort_order,
      }
      if (existing) {
        await adminApi.plans.update(existing.id, payload)
        keptIds.add(existing.id)
      } else {
        const created = await adminApi.plans.create(payload)
        keptIds.add(asString(asRecord(created).id))
      }
    } else if (existing) {
      await adminApi.plans.delete(existing.id)
    }
  }

  // Remove leftover tier plans (e.g. seeded Basic/Pro/Enterprise all marked monthly).
  for (const existing of forProduct) {
    if (!keptIds.has(existing.id)) {
      await adminApi.plans.delete(existing.id)
    }
  }
}

export function buildPlanFormFromProduct(
  productId: string,
  plans: Array<{ id: string; product_id: string; billing_cycle: string; price: number; description?: string; is_active?: boolean; is_popular?: boolean; slug?: string }>,
): PlanFormValues {
  const forProduct = plans.filter((p) => sameProductId(p.product_id, productId))
  const pick = (cycle: string) =>
    forProduct.find((p) => p.billing_cycle === cycle && p.slug === cycle)
    ?? forProduct.find((p) => p.billing_cycle === cycle)

  const monthly = pick('monthly')
  const yearly = pick('yearly')
  const enterprise = pick('enterprise')
  const sample = monthly ?? yearly ?? enterprise

  return {
    product_id: productId,
    description: sample?.description ?? '',
    is_active: sample?.is_active !== false,
    is_popular: Boolean(sample?.is_popular),
    price_monthly: monthly?.price ?? 0,
    price_yearly: yearly?.price ?? 0,
    price_enterprise: enterprise?.price ?? 0,
  }
}
