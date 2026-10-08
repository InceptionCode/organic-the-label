import { createStore } from 'zustand/vanilla'
import { getCartFn, addToCartFn, setCartQtyFn, removeCartLinesFn } from '~/lib/shopify/cart'
import type { Cart } from '~/lib/shopify/cart-types'

type CartStoreState = {
  cart: Cart | null | undefined
  isOpen: boolean
  isLoading: boolean
  error: string | null

  open: () => void
  close: () => void
  toggle: () => void

  refreshCart: () => Promise<void>
  addToCart: (variantId: string, quantity?: number, opts?: { openDrawer?: boolean }) => Promise<void>
  setQty: (lineId: string, quantity: number) => Promise<void>
  removeLine: (lineIds: string[]) => Promise<void>
  clearError: () => void
}

export type CartStore = CartStoreState

export const createCartStore = () =>
  createStore<CartStore>((set, get) => ({
    cart: null,
    isOpen: false,
    isLoading: false,
    error: null,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    clearError: () => set({ error: null }),

    refreshCart: async () => {
      set({ isLoading: true, error: null })
      try {
        const cart = await getCartFn()
        set({ cart, isLoading: false })
      } catch (e) {
        set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to load cart' })
      }
    },

    addToCart: async (variantId, quantity = 1, opts) => {
      set({ isLoading: true, error: null })
      try {
        const cart = await addToCartFn({ data: { variantId, quantity } })
        set({ cart, isLoading: false, isOpen: opts?.openDrawer ?? false })
      } catch (e) {
        set({ isLoading: false, error: e instanceof Error ? e.message : 'Add to cart failed' })
      }
    },

    setQty: async (lineId, quantity) => {
      const q = Math.max(0, Math.floor(quantity))
      if (q === 0) return get().removeLine([lineId])

      set({ isLoading: true, error: null })
      try {
        const cart = await setCartQtyFn({ data: { lineId, quantity: q } })
        set({ cart, isLoading: false })
      } catch (e) {
        set({ isLoading: false, error: e instanceof Error ? e.message : 'Update quantity failed' })
      }
    },

    removeLine: async (lineIds) => {
      set({ isLoading: true, error: null })
      try {
        const cart = await removeCartLinesFn({ data: { lineIds } })
        set({ cart, isLoading: false })
      } catch (e) {
        set({ isLoading: false, error: e instanceof Error ? e.message : 'Remove item failed' })
      }
    },
  }))
