export type SiteOffer = {
  id?: string
  text: string
  cta_label?: string
  cta_href?: string
  gradient?: string
  active?: boolean
  priority?: number
  start_date?: string | null
  end_date?: string | null
}

export type CouponType = 'percent' | 'fixed'

export type AdminCoupon = {
  id: string
  code: string
  name: string
  type: CouponType
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  max_uses_per_user: number | null
  product_id: string | null
  product_name?: string
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  description: string | null
}

export type CouponValidation = {
  code: string
  name: string
  type: CouponType
  value: number
  subtotal: number
  discount_amount: number
  total_after_discount: number
  line_discounts: number[]
}
