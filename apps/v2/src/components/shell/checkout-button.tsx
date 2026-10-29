import { track } from '~/lib/track'
import { buttonClasses } from '~/ui/button'

const classes = buttonClasses({ size: 'lg', className: 'w-full justify-center' })

/**
 * Hands off to Shopify's hosted checkout in the same tab (owner decision 2026-10-18; no target="_blank").
 * Disabled while there is no checkout URL or a cart mutation is running, so the shopper never checks
 * out a cart that is about to change. `checkout_clicked` fires on the real click; the queue's pagehide
 * flush sends it as the tab leaves for Shopify.
 */
export function CheckoutButton({ checkoutUrl, disabled }: { checkoutUrl: string | null; disabled: boolean }) {
  if (checkoutUrl && !disabled) {
    return (
      <a href={checkoutUrl} data-testid="checkout-btn" onClick={() => track('checkout_clicked')} className={classes}>
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
