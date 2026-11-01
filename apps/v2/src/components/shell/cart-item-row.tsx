import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import type { CartLine } from '~/server/shopify/types'
import { formatMoney } from '~/lib/format'
import { QuantityControl } from '~/ui/quantity-control'
import { ShopifyImage } from '~/ui/shopify-image'

type CartItemRowProps = {
  line: CartLine
  disabled: boolean
  onSetQuantity: (lineId: string, quantity: number) => void
  onRemove: (lineId: string) => void
  onNavigate: () => void
}

export function CartItemRow({ line, disabled, onSetQuantity, onRemove, onNavigate }: CartItemRowProps) {
  const titleId = useId()
  const { image, price, product, title: variantTitle } = line.merchandise

  return (
    <li data-testid="cart-item" className="grid grid-cols-[80px_1fr] gap-4 border-b border-[color:var(--border-subtle)] py-5">
      {/* Square-corner art (radius 0), like the store cards. */}
      <div className="relative size-20 shrink-0 overflow-hidden bg-surface-3">
        {image?.url ? (
          <ShopifyImage
            src={image.url}
            alt={image.altText ?? product.title}
            width={80}
            height={80}
            sizes="80px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-2" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              id={titleId}
              to="/store/$handle"
              params={{ handle: product.handle }}
              onClick={onNavigate}
              className="line-clamp-2 rounded-sm text-body-m font-medium leading-snug text-primary transition-colors duration-150 hover:text-[color:var(--text-secondary)] active:opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
            >
              {product.title}
            </Link>
            {variantTitle && variantTitle !== 'Default Title' && <p className="text-label mt-1">{variantTitle}</p>}
          </div>
          <p className="shrink-0 pt-px text-body-s tabular-nums text-secondary">{formatMoney(price.amount, price.currencyCode)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <QuantityControl
            quantity={line.quantity}
            min={0}
            labelledBy={titleId}
            itemName={product.title}
            disabled={disabled}
            onDecrement={() => onSetQuantity(line.id, line.quantity - 1)}
            onIncrement={() => onSetQuantity(line.id, line.quantity + 1)}
            onRemove={() => onRemove(line.id)}
          />
        </div>
      </div>
    </li>
  )
}
