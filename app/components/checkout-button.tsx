'use client';

import Link from 'next/link';
import { Button } from '@/ui-components/button';

type CheckoutButtonProps = {
  checkoutUrl: string | null;
  disabled?: boolean;
  className?: string;
};

export function CheckoutButton({ checkoutUrl, disabled, className = '' }: CheckoutButtonProps) {
  const canCheckout = Boolean(checkoutUrl) && !disabled;

  if (canCheckout && checkoutUrl) {
    return (
      <Button
        asChild
        variant="default"
        size="lg"
        className={`w-full justify-center ${className}`}
      >
        <Link href={checkoutUrl}>Checkout</Link>
      </Button>
    );
  }

  return (
    <Button variant="default" size="lg" disabled className={`w-full justify-center opacity-60 ${className}`}>
      Checkout
    </Button>
  );
}
