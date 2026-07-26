import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { clientApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'

export default function TrialButton({ productSlug, days, isAuthenticated, autoStart = false }: { productSlug: string; days: number; isAuthenticated: boolean; autoStart?: boolean }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const autoStarted = useRef(false)

  const startTrial = useCallback(async () => {
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
      toast({ title: 'Trial error', description: getApiErrorMessage(err, 'Failed to start trial.'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, navigate, productSlug])

  useEffect(() => {
    if (!autoStart || !isAuthenticated || autoStarted.current) return

    autoStarted.current = true
    void startTrial()
  }, [autoStart, isAuthenticated, startTrial])

  return (
    <button type="button" onClick={startTrial} disabled={loading} className="product-buy-panel__trial">
      <Sparkles className="h-4 w-4" />
      {loading ? 'Starting trialâ€¦' : `Try free for ${days} days`}
    </button>
  )
}
