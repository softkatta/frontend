import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addItem, removeItem, clearCart, type BillingCycle, type CartItem } from '@/store/slices/cartSlice'
import { useAuth } from '@/hooks/useAuth'
import { productsApi } from '@/services/api'
import { mapApiProduct } from '@/lib/apiMappers'
import { resolvePlan } from '@/lib/purchasePlan'
import { getProductScreenshot } from '@/lib/productAssets'
import { toast } from '@/components/ui/toaster'

async function resolveProduct(slug: string) {
  const raw = await productsApi.get(slug)
  return { raw, product: mapApiProduct(raw) }
}

export function useCart() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, hasRole } = useAuth()
  const items = useAppSelector((s) => s.cart.items)

  const itemCount = items.length
  const subtotal = items.reduce((sum, i) => sum + i.price, 0)

  const requireClientAuth = useCallback(
    (returnPath?: string) => {
      const redirect = encodeURIComponent(returnPath ?? location.pathname + location.search)
      navigate(`/login?redirect=${redirect}`)
    },
    [navigate, location],
  )

  const addProduct = useCallback(
    async (
      slug: string,
      billing: BillingCycle = 'monthly',
      options?: { goToCart?: boolean; planId?: string },
    ) => {
      if (!isAuthenticated || !hasRole('client')) {
        requireClientAuth(`/products/${slug}?buy=${billing}`)
        return false
      }

      const resolved = await resolveProduct(slug).catch(() => null)
      if (!resolved) return false
      const { raw, product } = resolved
      const plan = resolvePlan(raw, billing, options?.planId)
      if (!plan.planId) {
        toast({
          title: 'Plan not available',
          description: `No ${billing} plan is configured for ${product.name}. Try another billing cycle.`,
          variant: 'destructive',
        })
        return false
      }

      const payload: CartItem = {
        productId: plan.productId,
        planId: plan.planId,
        planName: plan.planName,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: plan.price,
        billing: plan.billing,
        screenshot: product.images[0] ?? getProductScreenshot(slug),
      }
      dispatch(addItem(payload))

      if (options?.goToCart !== false) {
        navigate('/cart')
      }
      return true
    },
    [dispatch, isAuthenticated, hasRole, navigate, requireClientAuth],
  )

  const buyNow = useCallback(
    async (slug: string, billing: BillingCycle = 'monthly', planId?: string) => {
      if (!isAuthenticated || !hasRole('client')) {
        requireClientAuth(`/products/${slug}?buy=${billing}`)
        return
      }
      const ok = await addProduct(slug, billing, { goToCart: false, planId })
      if (ok) navigate('/checkout')
    },
    [addProduct, isAuthenticated, hasRole, navigate, requireClientAuth],
  )

  const removeFromCart = useCallback(
    (planId: string) => {
      dispatch(removeItem({ planId }))
    },
    [dispatch],
  )

  const emptyCart = useCallback(() => {
    dispatch(clearCart())
  }, [dispatch])

  return {
    items,
    itemCount,
    subtotal,
    addProduct,
    buyNow,
    removeFromCart,
    emptyCart,
    requireClientAuth,
  }
}
