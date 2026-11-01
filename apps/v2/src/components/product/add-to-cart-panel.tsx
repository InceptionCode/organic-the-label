import { useId, useState } from 'react'
import { QuantityControl } from '~/ui/quantity-control'
import { AddToCartButton } from './add-to-cart-button'

/** Flat stepper beside a full-width red add-to-cart; no surrounding box. */
export function AddToCartPanel({ variantId, availableForSale }: { variantId: string | null; availableForSale: boolean }) {
  const [quantity, setQuantity] = useState(1)
  const labelId = useId()

  return (
    <div>
      <span id={labelId} className="sr-only">
        Quantity
      </span>
      <div className="flex items-stretch gap-3">
        <QuantityControl
          quantity={quantity}
          labelledBy={labelId}
          disabled={!availableForSale}
          variant="flat"
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          onIncrement={() => setQuantity((q) => Math.min(99, q + 1))}
        />
        <AddToCartButton variantId={variantId} quantity={quantity} openDrawer disabled={!availableForSale} size="lg" className="min-w-0 flex-1" />
      </div>
      {!availableForSale && <p className="mt-3 text-body-s text-muted">This item is currently unavailable.</p>}
    </div>
  )
}
