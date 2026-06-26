import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type BillingCycle = 'monthly' | 'yearly'

export interface CartItem {
  productId: string
  planId: string
  planName: string
  slug: string
  name: string
  category: string
  price: number
  billing: BillingCycle
  screenshot: string
}

interface CartState {
  items: CartItem[]
}

const STORAGE_KEY = 'softkatta_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items = JSON.parse(raw) as Partial<CartItem>[]
    return items
      .filter((item) => item.slug && item.planId && item.productId)
      .map((item) => ({
        productId: String(item.productId),
        planId: String(item.planId),
        planName: item.planName ?? '',
        slug: String(item.slug),
        name: String(item.name ?? ''),
        category: String(item.category ?? ''),
        price: Number(item.price) || 0,
        billing: item.billing === 'yearly' ? 'yearly' : 'monthly',
        screenshot: String(item.screenshot ?? ''),
      }))
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const initialState: CartState = { items: loadCart() }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const idx = state.items.findIndex((i) => i.planId === action.payload.planId)
      if (idx >= 0) {
        state.items[idx] = action.payload
      } else {
        state.items.push(action.payload)
      }
      saveCart(state.items)
    },
    removeItem: (state, action: PayloadAction<{ planId: string }>) => {
      state.items = state.items.filter((i) => i.planId !== action.payload.planId)
      saveCart(state.items)
    },
    updateBilling: (
      state,
      action: PayloadAction<{ slug: string; billing: BillingCycle; price: number }>,
    ) => {
      const item = state.items.find((i) => i.slug === action.payload.slug)
      if (item) {
        item.billing = action.payload.billing
        item.price = action.payload.price
      }
      saveCart(state.items)
    },
    clearCart: (state) => {
      state.items = []
      saveCart(state.items)
    },
    hydrateCart: (state) => {
      state.items = loadCart()
    },
  },
})

export const { addItem, removeItem, updateBilling, clearCart, hydrateCart } = cartSlice.actions
export default cartSlice.reducer
