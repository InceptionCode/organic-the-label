import { Cart } from '@/lib/schemas';
import { jsonFetch } from '@/utils/helpers/json-fetch';
import { createStore } from 'zustand/vanilla'

type CartStoreState = {
  cart: Cart | null | undefined;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  open: () => void;
  close: () => void;
  toggle: () => void;

  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number, opts?: { openDrawer?: boolean }) => Promise<void>;
  setQty: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineIds: string[]) => Promise<void>;
  clearError: () => void;
};

export type CartStore = CartStoreState;

type CartApiOk<T> = { ok: true } & T;

export const createCartStore = () => {
  // Add logic to update local storage when an element is added to the cart
  return createStore<CartStore>((set, get) => ({
    cart: null,
    isOpen: false,
    isLoading: false,
    error: null,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),

    clearError: () => set({ error: null }),

    refreshCart: async () => {
      set({ isLoading: true, error: null });

      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart | null }>>(
          "/api/store/cart/get",
          { method: "GET", cache: "no-store" },
          { failOnOkFalse: true },
        );

        set({ cart: data.cart, isLoading: false });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load cart";
        set({ isLoading: false, error: message });
      }
    },

    addToCart: async (variantId, quantity = 1, opts) => {
      set({ isLoading: true, error: null });

      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>(
          "/api/store/cart/add",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, quantity }),
          },
          { failOnOkFalse: true },
        );

        set({
          cart: data.cart,
          isLoading: false,
          isOpen: opts?.openDrawer ?? false
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Add to cart failed";
        set({ isLoading: false, error: message });
      }
    },

    setQty: async (lineId, quantity) => {
      const q = Math.max(0, Math.floor(quantity));
      if (q === 0) return get().removeLine([lineId]);

      set({ isLoading: true, error: null });
      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>(
          "/api/store/cart/update",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineId, quantity: q }),
          },
          { failOnOkFalse: true },
        );

        set({ cart: data.cart, isLoading: false });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Update quantity failed";
        set({ isLoading: false, error: message });
      }
    },

    removeLine: async (lineIds) => {
      set({ isLoading: true, error: null });
      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>(
          "/api/store/cart/remove",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineIds }),
          },
          { failOnOkFalse: true },
        );

        set({ cart: data.cart, isLoading: false });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Remove item failed";
        set({ isLoading: false, error: message });
      }
    }
  }))
}