import { Link } from 'react-router-dom'
import { type LucideIcon, Star, ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { getProductScreenshot } from '@/lib/productAssets'
import { productTrialLabel, productTrialRegisterUrl } from '@/lib/productTrial'
import { resolveMediaUrl } from '@/lib/mediaUrl'

interface ShopProductCardProps {
  id: string
  slug: string
  name: string
  description: string
  category: string
  priceMonthly: number
  priceYearly: number
  monthlyPlanName?: string
  defaultMonthlyPlanId?: string
  icon: LucideIcon
  hasFreeTrial?: boolean
  trialDays?: number
  index?: number
  featured?: boolean
  imageUrl?: string
  className?: string
}

export function ShopProductCard({
  slug,
  name,
  description,
  category,
  priceMonthly,
  priceYearly,
  monthlyPlanName,
  defaultMonthlyPlanId,
  hasFreeTrial = false,
  trialDays = 14,
  index = 0,
  featured = false,
  imageUrl,
  className,
}: ShopProductCardProps) {
  const { addProduct, buyNow } = useCart()
  const yearlySave = priceMonthly > 0 && priceYearly > 0
    ? Math.round((1 - priceYearly / (priceMonthly * 12)) * 100)
    : 0
  const screenshot = imageUrl ? resolveMediaUrl(imageUrl) : getProductScreenshot(slug)

  return (
    <article
      className={cn('shop-product-card group', featured && 'shop-product-card--featured', className)}
      style={{ '--shop-i': index } as React.CSSProperties}
    >
      <Link to={`/products/${slug}`} className="shop-product-card__media block relative overflow-hidden">
        <img
          src={screenshot}
          alt={`${name} dashboard screenshot`}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="shop-product-card__media-overlay absolute inset-0" aria-hidden />

        {featured && (
          <span className="shop-product-card__badge shop-product-card__badge--hot">
            <Star className="h-3 w-3 fill-current" /> Bestseller
          </span>
        )}
        {hasFreeTrial && (
          <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-[var(--brand-teal)] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
            {productTrialLabel({ trial_days: trialDays })}
          </span>
        )}

        <div className="shop-product-card__quick absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          <span className="block text-center py-2.5 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm">
            View details →
          </span>
        </div>
      </Link>

      <div className="shop-product-card__body flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--brand-blue)]">{category}</span>
            <h3 className="font-display font-bold text-base sm:text-lg leading-snug group-hover:text-[var(--brand-blue)] transition-colors">
              <Link to={`/products/${slug}`}>{name}</Link>
            </h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 text-[var(--brand-teal)]">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3 w-3 fill-current opacity-90" />
            ))}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">
          {description}
        </p>

        <div className="shop-product-card__price-row flex items-end justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div>
            <p className="font-display font-bold text-xl text-[var(--text-hero,var(--foreground))]">
              {formatCurrency(priceMonthly)}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </p>
            {monthlyPlanName && (
              <p className="text-[10px] text-muted-foreground font-medium">{monthlyPlanName} plan</p>
            )}
            {priceYearly > 0 && (
              <p className="text-[10px] text-[var(--brand-teal)] font-medium">Save {yearlySave}% yearly</p>
            )}
          </div>
        </div>

        <div className={cn('grid gap-2 mt-4', hasFreeTrial ? 'grid-cols-1' : 'grid-cols-2')}>
          {hasFreeTrial && (
            <Link
              to={productTrialRegisterUrl(slug)}
              className="shop-product-card__btn inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs sm:text-sm font-semibold bg-[var(--brand-teal)]/15 text-[var(--brand-teal)] border border-[var(--brand-teal)]/30 hover:bg-[var(--brand-teal)]/25"
            >
              <Sparkles className="h-3.5 w-3.5" /> Start free trial
            </Link>
          )}
          <div className={cn('grid gap-2', hasFreeTrial ? 'grid-cols-2' : 'col-span-2 grid-cols-2')}>
          <button
            type="button"
            onClick={() => buyNow(slug, 'monthly', defaultMonthlyPlanId)}
            className="shop-product-card__btn shop-product-card__btn--cart inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs sm:text-sm font-semibold"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Buy
          </button>
          <button
            type="button"
            onClick={() => addProduct(slug, 'monthly', { planId: defaultMonthlyPlanId })}
            className="shop-product-card__btn shop-product-card__btn--secondary inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs sm:text-sm font-semibold"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Cart
          </button>
          </div>
        </div>
        <Link
          to={`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`}
          className="mt-2 text-center text-[10px] text-muted-foreground hover:text-[var(--brand-blue)]"
        >
          Login required to purchase
        </Link>
      </div>
    </article>
  )
}
