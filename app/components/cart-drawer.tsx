'use client';

import { useCartStore } from '@/store/cart-context';
import { Drawer } from '@/ui-components';
import { PriceDisplay } from './price-display';
import { CartItemRow } from './cart-item-row';
import { CheckoutButton } from './checkout-button';

export default function CartDrawer() {
  const cart = useCartStore((s) => s.cart);
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const isLoading = useCartStore((s) => s.isLoading);

  const lines = cart?.lines.edges.map((e) => e.node) ?? [];
  const totalItems = cart?.totalQuantity ?? 0;
  const totalAmount = cart?.cost.totalAmount;
  const isEmpty = lines.length === 0;

  return (
    <Drawer isOpen={isOpen} onClose={close} placement="right">
      <div className="flex flex-col h-full pt-10">
        <h2 className="text-h3 text-primary mb-6">Cart</h2>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-body-m text-muted mb-4">Your cart is empty.</p>
            <p className="text-body-s text-muted">Add something from the store to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {lines.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  onSetQty={setQty}
                  onRemove={removeLine}
                  disabled={isLoading}
                />
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
                  <PriceDisplay amount={totalAmount.amount} currencyCode={totalAmount.currencyCode} />
                ) : (
                  <span className="price-text text-muted">—</span>
                )}
              </div>
              <CheckoutButton checkoutUrl={cart?.checkoutUrl ?? null} disabled={isLoading} />
              <p className="text-caption text-muted">
                Checkout and downloads are handled by Shopify.
              </p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
