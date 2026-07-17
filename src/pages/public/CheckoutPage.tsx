import { useRef, useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CreditCard, Shield, Smartphone, Tag, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { clientApi, productsApi } from '@/services/api'
import { asBool, asRecord, asString, getApiErrorMessage } from '@/lib/apiHelpers'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { resolvePlan, resolvePurchaseIds } from '@/lib/purchasePlan'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { calculateGstAmount, formatGstLabel } from '@/lib/gst'
import { toast } from '@/components/ui/toaster'
import type { CouponValidation } from '@/types/offers'

type SummaryLine = {
  key: string
  productName: string
  planName: string
  billing: string
  price: number
}

type PurchaseLine = {
  productId: string
  planId: string
  productName: string
}

export default function CheckoutPage() {
  const { items } = useCart()
  const { isAuthenticated, hasRole, user } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [summaryLines, setSummaryLines] = useState<SummaryLine[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const { gstRate, gstEnabled } = useSiteBranding()
  const completingPurchase = useRef(false)
  const subtotal = summaryLines.reduce((sum, line) => sum + line.price, 0)
  const discount = appliedCoupon?.discount_amount ?? 0
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const gst = gstEnabled ? calculateGstAmount(discountedSubtotal, gstRate) : 0
  const total = discountedSubtotal + gst

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      if (items.length === 0) {
        setSummaryLines([])
        setSummaryLoading(false)
        return
      }

      setSummaryLoading(true)
      const lines = await Promise.all(
        items.map(async (item) => {
          try {
            const raw = await productsApi.get(item.slug)
            const plan = resolvePlan(raw, item.billing, item.planId)
            return {
              key: item.planId,
              productName: item.name,
              planName: plan.planName || item.planName || 'Plan',
              billing: plan.billing,
              price: plan.price,
            }
          } catch {
            return {
              key: item.planId,
              productName: item.name,
              planName: item.planName || 'Plan',
              billing: item.billing,
              price: item.price,
            }
          }
        }),
      )

      if (!cancelled) {
        setSummaryLines(lines)
        setSummaryLoading(false)
      }
    }

    void loadSummary()
    return () => {
      cancelled = true
    }
  }, [items])

  if (!isAuthenticated || !hasRole('client')) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/checkout')}`} replace />
  }

  if (!completingPurchase.current && items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const finishSuccess = (orderNumber: string, invoiceId: string, itemCount: number, productName: string) => {
    completingPurchase.current = true
    navigate('/checkout/success', {
      replace: true,
      state: { orderNumber, invoiceId, itemCount, productName },
    })
  }

  const verifyStubPayment = async (paymentId: string, orderId: string) => {
    await clientApi.payments.verify({
      payment_id: paymentId,
      razorpay_payment_id: `pay_stub_${Date.now()}`,
      razorpay_order_id: orderId,
      razorpay_signature: 'stub',
    })
  }

  const resolvePurchaseLines = async (): Promise<PurchaseLine[]> => {
    const lines: PurchaseLine[] = []

    for (const item of items) {
      const raw = await productsApi.get(item.slug)
      const { productId, planId } = resolvePurchaseIds(raw, item.billing, item.planId)
      if (!planId) {
        throw new Error(`No ${item.billing} plan is configured for ${item.name}.`)
      }

      lines.push({
        productId,
        planId,
        productName: item.name,
      })
    }

    return lines
  }

  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return

    setCouponLoading(true)
    try {
      const purchaseLines = await resolvePurchaseLines()
      const result = await clientApi.coupons.validate({
        coupon_code: code,
        items: purchaseLines.map((line) => ({
          product_id: line.productId,
          plan_id: line.planId,
        })),
      })
      setAppliedCoupon(result)
      toast({ title: 'Coupon applied', description: `${result.code} — You save ${formatCurrency(result.discount_amount)}` })
    } catch (error) {
      setAppliedCoupon(null)
      toast({ title: 'Invalid coupon', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const purchaseLines = await resolvePurchaseLines()
      const result = asRecord(await clientApi.purchaseBatch({
        items: purchaseLines.map((line) => ({
          product_id: line.productId,
          plan_id: line.planId,
        })),
        payment_gateway: 'razorpay',
        coupon_code: appliedCoupon?.code,
      }))

      const order = asRecord(result.order)
      const invoice = asRecord(result.invoice)
      const orderNumber = asString(order.order_number)
      const invoiceId = asString(invoice.id)
      const itemCount = Number(result.item_count ?? purchaseLines.length)
      const primaryName = purchaseLines[0]?.productName ?? 'your products'
      const productLabel = itemCount > 1
        ? `${itemCount} products`
        : primaryName
      const requiresPayment = asBool(result.requires_payment)
      const skipReason = asString(result.skip_payment_reason)

      if (!requiresPayment) {
        if (skipReason === 'free_trial') {
          toast({
            title: 'Free trial started',
            description: 'Your free trial subscriptions are now active.',
          })
        }
        finishSuccess(orderNumber, invoiceId, itemCount, productLabel)
        return
      }

      const payment = asRecord(result.payment)
      const checkout = asRecord(result.checkout)
      const paymentId = asString(payment.id)
      const razorpayOrderId = asString(checkout.razorpay_order_id ?? checkout.transaction_id)
      const razorpayKeyId = asString(checkout.razorpay_key_id)
      const isStub = asBool(checkout.stub)

      if (isStub || !razorpayKeyId) {
        await verifyStubPayment(paymentId, razorpayOrderId)
        toast({
          title: 'Payment completed (stub mode)',
          description: 'Configure Razorpay in Admin → Settings → Integrations for live payments.',
        })
        finishSuccess(orderNumber, invoiceId, itemCount, productLabel)
        return
      }

      const amountPaise = Number(checkout.amount_paise ?? Math.round(total * 100))
      const response = await openRazorpayCheckout({
        key: razorpayKeyId,
        amount: amountPaise,
        currency: asString(checkout.currency, 'INR'),
        name: 'SoftKatta',
        description: itemCount > 1
          ? `${itemCount} product subscriptions`
          : `${primaryName} subscription`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.first_name ? `${user.first_name} ${user.last_name ?? ''}`.trim() : undefined,
          email: user?.email,
        },
        theme: { color: '#1e40af' },
      })

      await clientApi.payments.verify({
        payment_id: paymentId,
        ...response,
      })

      finishSuccess(orderNumber, invoiceId, itemCount, productLabel)
    } catch (error) {
      toast({ title: 'Payment failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <section className="hero-cyber pt-24 pb-10 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock label="Secure Checkout" title="Complete" highlight="Purchase" />
        </div>
      </section>

      <PageSection tone="muted" className="!pt-4">
        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <form onSubmit={(e) => void handlePay(e)} className="lg:col-span-3 space-y-6">
            <div className="premium-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[var(--brand-blue)]" /> Billing Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : ''} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" defaultValue={user?.email ?? ''} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company</Label>
                  <Input defaultValue={user?.company ?? ''} />
                </div>
              </div>
            </div>

            <div className="premium-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-[var(--brand-teal)]" /> Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/5 px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{appliedCoupon.code}</p>
                    <p className="text-xs text-[var(--brand-teal)]">−{formatCurrency(appliedCoupon.discount_amount)} applied</p>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon e.g. SAVE20"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={couponLoading || summaryLoading || !couponInput.trim()}
                    className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--border)] hover:bg-[var(--muted)]/40 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            <div className="premium-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--brand-teal)]" /> Payment via Razorpay
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Pay securely using UPI, credit/debit card, or net banking. You will be redirected to the Razorpay
                checkout window to complete your payment.
              </p>
            </div>

            <button type="submit" disabled={processing || summaryLoading} className="glow-btn w-full py-3.5 rounded-full font-semibold disabled:opacity-60">
              {processing ? 'Processing…' : summaryLoading ? 'Loading…' : `Pay ${formatCurrency(total)}`}
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            <div className="premium-card p-6">
              <h3 className="font-display font-bold mb-4">Order Summary</h3>
              <div className="space-y-3">
                {summaryLoading ? (
                  <p className="text-sm text-[var(--muted-foreground)]">Loading plan prices…</p>
                ) : (
                  summaryLines.map((line) => (
                    <div key={line.key} className="flex justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{line.productName}</p>
                        <p className="text-[var(--muted-foreground)] text-xs mt-0.5">
                          {line.planName} · {line.billing}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">{formatCurrency(line.price)}</span>
                    </div>
                  ))
                )}
                <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--brand-teal)]">
                      <span>Coupon ({appliedCoupon?.code})</span>
                      <span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {gstEnabled && (
                    <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">GST ({formatGstLabel(gstRate)})</span><span>{formatCurrency(gst)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Shield className="h-4 w-4 text-[var(--brand-teal)]" />
              Secured with Razorpay · UPI, Card & Net Banking
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
