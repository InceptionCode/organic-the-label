'use client';

import { useState } from 'react';
import AddToCartButton from '@/app/components/add-to-cart';

type AddToCartPanelProps = {
  variantId: string;
  availableForSale?: boolean;
};

export function AddToCartPanel({ variantId, availableForSale = true }: AddToCartPanelProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="rounded-lg border border-subtle bg-surface-1 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-body-s text-secondary">Quantity</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-md border border-default bg-surface-2 text-primary hover:bg-surface-3 transition-soft flex items-center justify-center"
          >
            −
          </button>
          <span className="meta min-w-[2ch] text-center tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-9 w-9 rounded-md border border-default bg-surface-2 text-primary hover:bg-surface-3 transition-soft flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
      <AddToCartButton variantId={variantId} quantity={quantity} openDrawer />
      {!availableForSale && (
        <p className="text-body-s text-muted">This item is currently unavailable.</p>
      )}
    </div>
  );
}
