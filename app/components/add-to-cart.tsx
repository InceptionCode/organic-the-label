"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-context";
import { Button } from "@/ui-components/button";

export default function AddToCartButton({
  variantId,
  quantity = 1,
  openDrawer = false
}: {
  variantId: string;
  quantity?: number;
  openDrawer?: boolean;
}) {
  // Local loading state so only THIS button shows "Adding..." during its own
  // request. The global store.isLoading is intentionally NOT used here —
  // reading it would cause every AddToCartButton on the page to flip to
  // "Adding..." whenever any one of them fires.
  const [isPending, setIsPending] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await addToCart(variantId, quantity, { openDrawer });
    } catch {
      // The store's addToCart captures errors in store.error and surfaces them
      // via the cart drawer's error banner. Swallow here so the rejected
      // handleClick promise does not become an unhandled rejection.
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      data-testid="add-to-cart-btn"
      className="flex-1"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Adding..." : "Add to cart"}
    </Button>
  );
}
