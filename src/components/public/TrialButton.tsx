import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { clientApi } from '@/services/api'

export default function TrialButton({ productSlug, days, isAuthenticated }: { productSlug: string; days: number; isAuthenticated: boolean }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function startTrial() {
    if (!isAuthenticated) {
      navigate(`/register?redirect=${encodeURIComponent(`/products/${productSlug}?trial=1`)}`)
      return
    }

    setLoading(true)
    try {
      await clientApi.products.startTrial(productSlug)
      toast({ title: 'Trial started', description: 'Your free trial has begun. Check Subscriptions for details.', variant: 'success' })
      // navigate to subscriptions or dashboard
      navigate('/dashboard/subscriptions')
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to start trial.'
      toast({ title: 'Trial error', description: String(msg), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={startTrial} disabled={loading} className="product-buy-panel__trial">
      <Sparkles className="h-4 w-4" />
      {loading ? 'Starting trial…' : `Try free for ${days} days`}
    </button>
  )
}
