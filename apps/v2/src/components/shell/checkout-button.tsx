import { buttonClasses } from '~/ui/button'

const classes = buttonClasses({ size: 'lg', className: 'w-full justify-center' })

/**
 * Hands off to Shopify's hosted checkout in the same tab (owner decision 2026-10-18; no target="_blank").
 * Disabled while there is no checkout URL or a cart mutation is running, so the shopper never checks
 * out a cart that is about to change. Phase 06 fires `checkout_clicked` from `onClick` here.
 */
export function CheckoutButton({ checkoutUrl, disabled }: { checkoutUrl: string | null; disabled: boolean }) {
  if (checkoutUrl && !disabled) {
    return (
      <a href={checkoutUrl} data-testid="checkout-btn" className={classes}>
        Checkout
      </a>
    )
  }

  return (
    <button type="button" data-testid="checkout-btn" disabled className={`${classes} disabled:opacity-60`}>
      Checkout
    </button>
  )
}
