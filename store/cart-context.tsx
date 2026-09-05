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

  useEffect(() => {
    // Checkout opens in a new tab (see CheckoutButton), so this tab never navigates
    // and never learns the purchase completed. Re-pull the cart from Shopify whenever
    // the user comes back to this tab so a completed/expired cart clears out of the UI
    // instead of sitting there stale.
    const refresh = () => store.getState().refreshCart?.().catch(() => { });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
