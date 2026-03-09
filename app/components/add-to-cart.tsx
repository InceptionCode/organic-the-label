"use client";

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
  const isLoading = useCartStore((s) => s.isLoading);
  const addToCart = useCartStore((s) => s.addToCart);

  return (
    <Button className="flex-1" onClick={() => addToCart(variantId, quantity, { openDrawer })} disabled={isLoading}>
      {isLoading ? "Adding..." : "Add to cart"}
    </Button>
  );
}