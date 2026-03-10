'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/cart-context';
import CartIcon from '@/ui-components/icons/cart-icon';

export default function CartIconButton() {
  const toggle = useCartStore((s) => s.toggle);
  const count = useCartStore((s) => s.cart?.totalQuantity ?? 0);

  return (
    <button
      type="button"
      className="relative p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center"
      onClick={toggle}
      aria-label={count > 0 ? `Cart has ${count} items` : 'Open cart'}
    >
      <div className='text-white'>
        <CartIcon />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-caption px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium min-w-[1.25rem] text-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
    </button>
  );
}