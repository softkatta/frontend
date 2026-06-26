import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, LayoutDashboard, CreditCard, ArrowRight } from 'lucide-react'
import { PageSection } from '@/components/common/SectionLabel'
import { motion } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import { toast } from '@/components/ui/toaster'

type SuccessState = {
  orderNumber?: string
  productName?: string
}

export default function CheckoutSuccessPage() {
  const location = useLocation()
  const { emptyCart } = useCart()
  const state = (location.state ?? {}) as SuccessState
  const orderNumber = state.orderNumber?.trim()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    emptyCart()
    toast({
      title: 'Payment successful!',
      description: orderNumber
        ? `Order ${orderNumber} is confirmed. Your subscription is now active.`
        : 'Your subscription is now active.',
      variant: 'success',
    })
  }, [emptyCart, orderNumber])

  return (
    <PageSection tone="default" className="min-h-[70vh] flex items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center premium-card p-10 sm:p-12 shadow-glow-lg"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-teal)]/15 mx-auto mb-6">
          <CheckCircle className="h-9 w-9 text-[var(--brand-teal)]" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-3">Payment Successful!</h1>
        {orderNumber ? (
          <p className="text-sm font-semibold text-[var(--brand-teal)] mb-3">
            Order #{orderNumber}
          </p>
        ) : null}
        <p className="text-muted-foreground leading-relaxed mb-8">
          {state.productName ? `${state.productName} is now active. ` : ''}
          A GST invoice has been sent to your email and is available in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard/subscriptions"
            className="glow-btn inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
          >
            <CreditCard className="h-4 w-4" /> View Subscriptions
          </Link>
          <Link
            to="/dashboard"
            className="hero-cta-ghost inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
          >
            <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
          </Link>
        </div>
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-[var(--brand-blue)] font-semibold mt-8 hover:gap-2 transition-all">
          Browse more products <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </PageSection>
  )
}
