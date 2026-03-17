'use client';

import { useContext, createContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { type CartStore, createCartStore } from '@/lib/store';

export type CartStoreApi = ReturnType<typeof createCartStore>;

export const CartStoreContext = createContext<CartStoreApi | null>(null);

export type CartStoreProviderProps = React.PropsWithChildren<{ initialCart?: CartStore['cart'] }>;
export const CartStoreProvider = ({ children }: CartStoreProviderProps) => {
  const [store] = useState(() => createCartStore());

  useEffect(() => {
    const refresh = store.getState().refreshCart;
    if (!refresh) return;

    refresh().catch(() => { });
  }, [store]);

  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>;
};

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStoreContext = useContext(CartStoreContext);

  if (!cartStoreContext) {
    throw new Error(`useCartStore must be used within CartStoreContext`);
  }

  return useStore(cartStoreContext, selector);
};
