'use client';

import { useRef, useContext, createContext, useEffect } from 'react';
import { useStore } from 'zustand';
import { type CartStore, createCartStore } from '@/lib/store';
import isEmpty from 'lodash/isEmpty';

export type CartStoreApi = ReturnType<typeof createCartStore>;

export const CartStoreContext = createContext<CartStoreApi | null>(null);

export type CartStoreProvider = React.PropsWithChildren<{ initialCart?: CartStore['cart'] }>;
export const CartStoreProvider = ({ children }: CartStoreProvider) => {
  const storeRef = useRef<CartStoreApi | null>(null);
  const refreshCart = useRef<(() => Promise<void>) | null>(null);

  if (isEmpty(storeRef.current)) {
    storeRef.current = createCartStore();
    refreshCart.current = storeRef.current.getState().refreshCart;
  }

  useEffect(() => {
    const refresh = refreshCart.current;
    if (isEmpty(refresh)) return;

    refresh().catch(() => { });
  }, [refreshCart.current]);

  return <CartStoreContext.Provider value={storeRef.current}>{children}</CartStoreContext.Provider>;
};

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStoreContext = useContext(CartStoreContext);

  if (!cartStoreContext) {
    throw new Error(`useCartStore must be used within CartStoreContext`);
  }

  return useStore(cartStoreContext, selector);
};
