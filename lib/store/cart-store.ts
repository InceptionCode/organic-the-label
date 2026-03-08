import { Cart } from '@/lib/schemas';
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
  removeLine: (lineId: string) => Promise<void>;
  clearError: () => void;
};

export type CartStore = CartStoreState;

type CartApiOk<T> = { ok: true } & T;
type CartApiErr = { ok: false; error?: string; errors?: any };

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data = (await res.json()) as any;

  if (!res.ok || data?.ok === false) {
    const msg =
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.map((e: any) => e?.message).join(", ") : null) ||
      "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

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
        const data = await jsonFetch<CartApiOk<{ cart: Cart | null }>>("/api/store/cart/get", {
          method: "GET",
          cache: "no-store",
        });

        set({ cart: data.cart, isLoading: false });
      } catch (e: any) {
        set({ isLoading: false, error: e?.message ?? "Failed to load cart" });
      }
    },

    addToCart: async (variantId, quantity = 1, opts) => {
      set({ isLoading: true, error: null });

      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>("/api/store/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });

        set({
          cart: data.cart,
          isLoading: false,
          isOpen: opts?.openDrawer ?? false
        });
      } catch (e: any) {
        set({ isLoading: false, error: e?.message ?? "Add to cart failed" });
      }
    },

    setQty: async (lineId, quantity) => {
      const q = Math.max(0, Math.floor(quantity));
      if (q === 0) return get().removeLine(lineId);

      set({ isLoading: true, error: null });
      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>("/api/store/cart/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId, quantity: q }),
        });

        set({ cart: data.cart, isLoading: false });
      } catch (e: any) {
        set({ isLoading: false, error: e?.message ?? "Update quantity failed" });
      }
    },

    removeLine: async (lineId) => {
      set({ isLoading: true, error: null });
      try {
        const data = await jsonFetch<CartApiOk<{ cart: Cart }>>("/api/store/cart/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId }),
        });

        set({ cart: data.cart, isLoading: false });
      } catch (e: any) {
        set({ isLoading: false, error: e?.message ?? "Remove item failed" });
      }
    }
  }))
}