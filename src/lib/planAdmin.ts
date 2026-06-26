import { adminApi } from '@/services/api'
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

export async function saveProductPlans(values: PlanFormValues, existingPlans: ExistingPlan[]) {
  const productId = Number(values.product_id)
  const forProduct = existingPlans.filter((p) => p.product_id === values.product_id)

  for (const cycle of CYCLES) {
    const price = values[cycle.key]
    const existing = forProduct.find((p) => p.billing_cycle === cycle.billing_cycle)

    if (price > 0) {
      const payload = {
        product_id: productId,
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
      } else {
        await adminApi.plans.create(payload)
      }
    } else if (existing) {
      await adminApi.plans.delete(existing.id)
    }
  }
}

export function buildPlanFormFromProduct(
  productId: string,
  plans: Array<{ id: string; product_id: string; billing_cycle: string; price: number; description?: string; is_active?: boolean; is_popular?: boolean }>,
): PlanFormValues {
  const forProduct = plans.filter((p) => p.product_id === productId)
  const monthly = forProduct.find((p) => p.billing_cycle === 'monthly')
  const yearly = forProduct.find((p) => p.billing_cycle === 'yearly')
  const enterprise = forProduct.find((p) => p.billing_cycle === 'enterprise')
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
