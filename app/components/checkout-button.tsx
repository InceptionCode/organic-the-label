'use client';

import Link from 'next/link';
import { Button } from '@/ui-components/button';
import { trackActivity } from '@/utils/helpers/activity/tracking';

import { useTrackingReady } from '@/store/activity-hydrator';

type CheckoutButtonProps = {
  checkoutUrl: string | null;
  disabled?: boolean;
  className?: string;
};

export function CheckoutButton({ checkoutUrl, disabled, className = '' }: CheckoutButtonProps) {
  const isTrackingReady = useTrackingReady();
  const canCheckout = Boolean(checkoutUrl) && !disabled;

  // checkout_clicked previously fired from a useEffect keyed on canCheckout, which
  // meant it logged the moment the button became enabled (e.g. right after any
  // add-to-cart), not when the user actually clicked it. Fire it on the real click instead.
  const handleCheckoutClick = () => {
    if (isTrackingReady) {
      trackActivity({
        eventType: "checkout_clicked",
      });
    }
  };

  if (canCheckout && checkoutUrl) {
    return (
      <Button
        asChild
        data-testid="checkout-btn"
        variant="default"
        size="lg"
        className={`w-full justify-center ${className}`}
      >
        <Link href={checkoutUrl} target='_blank' rel='noopener noreferrer' onClick={handleCheckoutClick}>Checkout</Link>
      </Button>
    );
  }

  return (
    <Button data-testid="checkout-btn" variant="default" size="lg" disabled className={`w-full justify-center opacity-60 ${className}`}>
      Checkout
    </Button>
  );
}
