import { CartItem } from '@/lib/schemas';
import { createStore } from 'zustand/vanilla'

export type CartStoreState = {
  cart?: CartItem[] | null
}

export type CartStore = CartStoreState;

export const defaultCartState: CartItem[] = []

export const createCartStore = (
  initState: CartStoreState = { cart: null }
) => {
  // Add logic to update local storage when an element is added to the cart
  return createStore<CartStore>()(() => ({
    ...initState
  }))
}