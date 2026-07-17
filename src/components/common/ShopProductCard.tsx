import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Check } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { getProductScreenshot } from '@/lib/productAssets'
import { productTrialRegisterUrl } from '@/lib/productTrial'
import { mediaSrc } from '@/lib/mediaUrl'
import { yearlySavingsPercent } from '@/lib/purchasePlan'

export interface ShopProductCardProps {
  slug: string
  name: string
  description: string
  category: string
  priceMonthly: number
  priceYearly: number
  features?: string[]
  hasFreeTrial?: boolean
  trialDays?: number
  index?: number
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
  features = [],
  hasFreeTrial = false,
  index = 0,
  imageUrl,
  className,
}: ShopProductCardProps) {
  const screenshot = imageUrl ? mediaSrc(imageUrl) : getProductScreenshot(slug)
  const savings = yearlySavingsPercent(priceMonthly, priceYearly)

  return (
    <article
      className={cn('shop-card group', className)}
      style={{ '--shop-i': index } as React.CSSProperties}
    >
      <div className="shop-card__border" aria-hidden />
      <div className="shop-card__shine" aria-hidden />

      <Link to={`/products/${slug}`} className="shop-card__preview block">
        <div className="shop-card__chrome">
          <span className="shop-card__dot shop-card__dot--red" />
          <span className="shop-card__dot shop-card__dot--amber" />
          <span className="shop-card__dot shop-card__dot--green" />
          <span className="shop-card__url">{slug}.softkatta.in</span>
        </div>
        <div className="shop-card__screen relative overflow-hidden">
          {screenshot ? (
            <img
              src={screenshot}
              alt={`${name} preview`}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="shop-card__screen-fallback" aria-hidden />
          )}
          <div className="shop-card__screen-overlay" aria-hidden />
        </div>
        <div className="shop-card__badges">
          <span className="shop-card__badge shop-card__badge--cat">{category}</span>
          {hasFreeTrial && (
            <span className="shop-card__badge shop-card__badge--trial">
              <Sparkles className="h-3 w-3" /> Trial
            </span>
          )}
        </div>
      </Link>

      <div className="shop-card__body">
        <div className="shop-card__head">
          <h3 className="shop-card__title">
            <Link to={`/products/${slug}`}>{name}</Link>
          </h3>
          {priceMonthly > 0 ? (
            <div className="shop-card__price">
              <span className="shop-card__price-value">{formatCurrency(priceMonthly)}</span>
              <span className="shop-card__price-unit">/mo</span>
            </div>
          ) : (
            <span className="shop-card__price-contact">Custom</span>
          )}
        </div>

        <p className="shop-card__desc">{description}</p>

        {features.length > 0 && (
          <ul className="shop-card__features">
            {features.slice(0, 3).map((f) => (
              <li key={f}>
                <Check className="h-3 w-3 shrink-0 text-[var(--brand-teal)]" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="shop-card__foot">
          {priceYearly > 0 && savings > 0 && (
            <span className="shop-card__save">Save {savings}% yearly</span>
          )}
          <Link to={`/products/${slug}`} className="shop-card__cta">
            Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {hasFreeTrial && (
          <Link to={productTrialRegisterUrl(slug)} className="shop-card__trial-link">
            Start free trial →
          </Link>
        )}
      </div>
    </article>
  )
}
