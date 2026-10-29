import { useIsMutating, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  cartMutationKey,
  cartMutationMessage,
  cartQueries,
  removeCartLinesMutation,
  updateCartLineMutation,
} from '~/queries/cart'
import { Button, ButtonLink } from '~/ui/button'
import { CloseIcon, flatCloseButtonClasses } from '~/ui/dialog'
import { Drawer } from '~/ui/drawer'
import { Price } from '~/ui/price'
import { CART_DRAWER_ID, useCartDrawer } from './cart-drawer-provider'
import { CartItemRow } from './cart-item-row'
import { CheckoutButton } from './checkout-button'

export function CartDrawer() {
  const { open, closeCart } = useCartDrawer()
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch, isRefetching } = useQuery(cartQueries.current())
  const updateLine = useMutation(updateCartLineMutation(queryClient))
  const removeLines = useMutation(removeCartLinesMutation(queryClient))
  const busy = useIsMutating({ mutationKey: cartMutationKey }) > 0

  const cart = data?.cart ?? null
  const lines = cart?.lines ?? []
  const totalAmount = cart?.cost.totalAmount

  return (
    <Drawer
      open={open}
      onClose={closeCart}
      title="Cart"
      id={CART_DRAWER_ID}
      closeLabel="Close cart"
      testId="cart-drawer"
      meta={lines.length > 0 ? `${cart?.totalQuantity ?? 0} ${cart?.totalQuantity === 1 ? 'item' : 'items'}` : undefined}
      className="pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <CartErrorBanner />

      {data ? (
        lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center border-t border-[color:var(--border-subtle)] py-12">
            <p className="text-h2 text-primary">Your cart is empty.</p>
            <p className="mt-3 mb-8 text-body-m text-secondary">Add something from the store to get started.</p>
            <ButtonLink to="/store" size="lg" onClick={closeCart} className="w-full">
              Browse the store
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul aria-label="Cart items" aria-busy={busy} className="-mx-6 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[color:var(--border-subtle)] px-6">
              {lines.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  disabled={busy}
                  onSetQuantity={(lineId, quantity) => updateLine.mutate({ lineId, quantity })}
                  onRemove={(lineId) => removeLines.mutate({ lineIds: [lineId] })}
                  onNavigate={closeCart}
                />
              ))}
            </ul>

            <div className="mt-auto shrink-0 space-y-4 border-t border-[color:var(--border-default)] pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-body-m text-secondary">Total</span>
                {totalAmount ? <Price amount={totalAmount.amount} currencyCode={totalAmount.currencyCode} /> : null}
              </div>
              <CheckoutButton checkoutUrl={cart?.checkoutUrl ?? null} disabled={busy} />
              <p className="text-label">Checkout and downloads are handled by Shopify.</p>
            </div>
          </>
        )
      ) : isPending ? (
        <CartSkeleton />
      ) : isError ? (
        <div role="alert" className="flex flex-1 flex-col justify-center border-t border-[color:var(--border-subtle)] py-12">
          <p className="text-h3 text-primary mb-2">Your cart could not be loaded.</p>
          <p className="text-body-m text-secondary mb-6">Check your connection, then try again.</p>
          <Button variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
            {isRefetching ? 'Loading...' : 'Try again'}
          </Button>
        </div>
      ) : null}
    </Drawer>
  )
}

/** Shows the latest failed cart mutation (any add, update, or remove) until dismissed or superseded. */
function CartErrorBanner() {
  const [dismissedAt, setDismissedAt] = useState(0)
  const mutations = useMutationState({
    filters: { mutationKey: cartMutationKey },
    select: (m) => ({ at: m.state.submittedAt, message: cartMutationMessage(m.state) }),
  })
  const latest = mutations.at(-1)
  const message = latest && latest.at !== dismissedAt ? latest.message : null

  return (
    <div aria-live="polite" className="shrink-0">
      {message ? (
        <div
          data-testid="cart-error"
          className="mb-4 flex items-start gap-3 border-l-2 border-[color:var(--accent-primary)] py-1 pl-4 pr-1"
        >
          <p className="flex-1 py-2.5 text-body-s text-primary">{message}</p>
          <button
            type="button"
            aria-label="Dismiss cart error"
            onClick={() => setDismissedAt(latest?.at ?? 0)}
            className={flatCloseButtonClasses}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="flex flex-1 flex-col border-t border-[color:var(--border-subtle)]" aria-busy="true" aria-label="Loading cart">
      {[0, 1].map((i) => (
        <div key={i} className="grid grid-cols-[80px_1fr] gap-4 border-b border-[color:var(--border-subtle)] py-5">
          <div className="size-20 bg-surface-3 animate-pulse motion-reduce:animate-none" />
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-4 w-3/4 rounded-[2px] bg-surface-3 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-1/3 rounded-[2px] bg-surface-3 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}
