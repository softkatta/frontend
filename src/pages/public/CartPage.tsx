import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { calculateGstAmount, formatGstLabel } from '@/lib/gst'
import { formatCurrency } from '@/lib/utils'

export default function CartPage() {
  const { items, subtotal, removeFromCart } = useCart()
  const { isAuthenticated, hasRole } = useAuth()
  const { gstRate } = useSiteBranding()
  const navigate = useNavigate()
  const gst = calculateGstAmount(subtotal, gstRate)

  if (!isAuthenticated || !hasRole('client')) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/cart')}`} replace />
  }

  return (
    <div>
      <section className="hero-cyber pt-24 pb-12 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock label="Your Cart" title="Shopping" highlight="Cart" description="Review items before checkout." />
        </div>
      </section>

      <PageSection tone="default" className="!pt-6">
        {items.length === 0 ? (
          <div className="shop-empty text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--border)] max-w-lg mx-auto">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-display font-bold text-lg mb-2">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Browse our software shop and add products.</p>
            <Link to="/products" className="glow-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold">
              <ShoppingBag className="h-4 w-4" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.planId} className="premium-card p-4 sm:p-5 flex gap-4">
                  <div className="shop-cart-thumb shrink-0 w-28 sm:w-32 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                    <img src={item.screenshot} alt={item.name} className="w-full h-full object-cover aspect-[16/10]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--brand-blue)] font-semibold">{item.category}</p>
                        <h3 className="font-display font-bold text-lg">{item.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.planName ? `${item.planName} · ` : ''}{item.billing} billing
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.planId)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-display font-bold text-xl mt-3 text-brand-gradient">
                      {formatCurrency(item.price)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        /{item.billing === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="premium-card p-6 h-fit sticky top-24 shadow-glow-md">
              <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({formatGstLabel(gstRate)})</span>
                  <span className="font-semibold">{formatCurrency(gst)}</span>
                </div>
              </div>
              <div className="flex justify-between font-display font-bold text-lg pt-4 border-t border-[var(--border)] mb-6">
                <span>Total</span>
                <span className="text-brand-gradient">{formatCurrency(subtotal + gst)}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="glow-btn w-full py-3 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/products" className="block text-center text-sm text-[var(--brand-blue)] font-semibold mt-4 hover:underline">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </PageSection>
    </div>
  )
}
