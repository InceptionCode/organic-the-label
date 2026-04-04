'use client';

import Link from 'next/link';
import { Button } from '@/ui-components/button';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { useEffect } from 'react';

import { useTrackingReady } from '@/store/activity-hydrator';

type CheckoutButtonProps = {
  checkoutUrl: string | null;
  disabled?: boolean;
  className?: string;
};

export function CheckoutButton({ checkoutUrl, disabled, className = '' }: CheckoutButtonProps) {
  const isTrackingReady = useTrackingReady();
  const canCheckout = Boolean(checkoutUrl) && !disabled;

  useEffect(() => {
    if (canCheckout && isTrackingReady) {
      trackActivity({
        eventType: "checkout_clicked",
      });
    }
  }, [canCheckout, isTrackingReady]);

  if (canCheckout && checkoutUrl) {
    return (
      <Button
        asChild
        variant="default"
        size="lg"
        className={`w-full justify-center ${className}`}
      >
        <Link href={checkoutUrl} target='_blank' rel='noopener noreferrer'>Checkout</Link>
      </Button>
    );
  }

  return (
    <Button variant="default" size="lg" disabled className={`w-full justify-center opacity-60 ${className}`}>
      Checkout
    </Button>
  );
}
