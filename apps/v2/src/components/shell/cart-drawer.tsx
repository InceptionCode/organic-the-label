import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '~/lib/format'
import { cartQueries } from '~/queries/cart'
import type { CartLine } from '~/server/shopify/types'
import { buttonClasses } from '~/ui/button'
import { Drawer } from '~/ui/drawer'
import { ShopifyImage } from '~/ui/shopify-image'
import { useCartDrawer } from './cart-drawer-provider'

export function CartDrawer() {
  const { open, closeCart } = useCartDrawer()
  const { data, isPending, isError } = useQuery(cartQueries.current())

  const cart = data?.cart ?? null
  const lines = cart?.lines ?? []
  const totalItems = cart?.totalQuantity ?? 0
  const totalAmount = cart?.cost.totalAmount

  return (
    <Drawer open={open} onClose={closeCart} title="Cart" testId="cart-drawer">
      {isPending ? (
        <div className="flex-1 flex flex-col gap-4 py-4" aria-busy="true" aria-label="Loading cart">
          {[0, 1].map((i) => (
            <div key={i} className="grid grid-cols-[72px_1fr] gap-4">
              <div className="h-[72px] w-[72px] rounded-md bg-surface-3 animate-pulse motion-reduce:animate-none" />
              <div className="flex flex-col gap-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-surface-3 animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-1/3 rounded bg-surface-3 animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <p className="text-body-m text-muted mb-4">Your cart could not be loaded.</p>
          <p className="text-body-s text-muted">Refresh the page to try again.</p>
        </div>
      ) : lines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <p className="text-body-m text-muted mb-4">Your cart is empty.</p>
          <p className="text-body-s text-muted">Add something from the store to get started.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {lines.map((line) => (
              <CartItemRow key={line.id} line={line} onNavigate={closeCart} />
            ))}
          </div>

          <div className="border-t border-subtle pt-6 mt-6 space-y-4">
            <div className="flex justify-between items-center text-body-m">
              <span className="text-secondary">Items</span>
              <span className="text-primary font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-secondary">Total</span>
              {totalAmount ? (
                <span className="price-text text-primary">{formatMoney(totalAmount.amount, totalAmount.currencyCode)}</span>
              ) : (
                <span className="price-text text-muted">-</span>
              )}
            </div>
            {cart?.checkoutUrl ? (
              <a
                href={cart.checkoutUrl}
                data-testid="checkout-btn"
                className={buttonClasses({ size: 'lg', className: 'w-full justify-center' })}
              >
                Checkout
              </a>
            ) : null}
            <p className="text-caption text-muted">Checkout and downloads are handled by Shopify.</p>
          </div>
        </>
      )}
    </Drawer>
  )
}

function CartItemRow({ line, onNavigate }: { line: CartLine; onNavigate: () => void }) {
  const img = line.merchandise.image
  const price = line.merchandise.price

  return (
    <div data-testid="cart-item" className="grid grid-cols-[72px_1fr] gap-4 py-4 border-b border-subtle last:border-b-0">
      <div className="relative w-[72px] h-[72px] shrink-0 rounded-md overflow-hidden bg-surface-3">
        {img?.url ? (
          <ShopifyImage
            src={img.url}
            alt={img.altText ?? line.merchandise.product.title}
            width={72}
            height={72}
            sizes="72px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-2" />
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <div>
          <Link
            to={'/store/$handle' as never}
            params={{ handle: line.merchandise.product.handle } as never}
            onClick={onNavigate}
            className="text-h5 text-primary hover:text-secondary active:opacity-70 transition-soft line-clamp-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            {line.merchandise.product.title}
          </Link>
          {line.merchandise.title && line.merchandise.title !== 'Default Title' && (
            <p className="meta mt-0.5">{line.merchandise.title}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
          <span className="price-text text-primary text-body-m">{formatMoney(price.amount, price.currencyCode)}</span>
          <span className="meta tabular-nums">Qty {line.quantity}</span>
        </div>
      </div>
    </div>
  )
}
