import { cn, formatCurrency } from '@/lib/utils'
import {
  availableBillingCycles,
  getProductPlanSummary,
  planForBilling,
  yearlySavingsPercent,
  type BillingCycle,
  type ProductPlanSummary,
} from '@/lib/purchasePlan'

type SimpleBillingToggleProps = {
  raw?: unknown
  summary?: ProductPlanSummary
  billing: BillingCycle
  onBillingChange: (billing: BillingCycle) => void
  showEnterprise?: boolean
  className?: string
}

function resolveSummary(raw?: unknown, summary?: ProductPlanSummary): ProductPlanSummary {
  if (summary) return summary
  if (raw) return getProductPlanSummary(raw)
  return { monthly: null, yearly: null, enterprise: null }
}

/** Minimal Monthly / Yearly switch + price. */
export function SimpleBillingToggle({
  raw,
  summary: summaryProp,
  billing,
  onBillingChange,
  showEnterprise = false,
  className,
}: SimpleBillingToggleProps) {
  const summary = resolveSummary(raw, summaryProp)
  const cycles = availableBillingCycles(summary).filter((c) => showEnterprise || c !== 'enterprise')
  const plan = planForBilling(summary, billing)
  const savings = yearlySavingsPercent(summary.monthly?.price ?? 0, summary.yearly?.price ?? 0)

  if (cycles.length === 0) {
    return <p className="text-sm text-muted-foreground">Pricing coming soon</p>
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex rounded-full border border-[var(--border)] p-1">
        {cycles.map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => onBillingChange(cycle)}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-semibold transition-all',
              billing === cycle
                ? 'bg-brand-gradient text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {cycle === 'monthly' ? 'Monthly' : cycle === 'yearly' ? 'Yearly' : 'Enterprise'}
          </button>
        ))}
      </div>
      {plan ? (
        <div className="text-center">
          <p className="font-display text-3xl font-bold">{formatCurrency(plan.price)}</p>
          <p className="text-sm text-muted-foreground">
            {billing === 'enterprise' ? 'Enterprise plan' : `per ${billing === 'monthly' ? 'month' : 'year'}`}
          </p>
          {billing === 'yearly' && savings > 0 ? (
            <p className="text-xs text-[var(--brand-teal)] font-medium mt-1">Save {savings}% vs monthly</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { getProductPlanSummary, planForBilling, type ProductPlanSummary, type BillingCycle }
