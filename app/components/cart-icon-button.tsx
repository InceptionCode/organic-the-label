'use client';
import { useCartStore } from '@/store/cart-context';
import CartIcon from '@/ui-components/icons/cart-icon';
import { trackActivity } from '@/utils/helpers/activity/tracking';

export default function CartIconButton() {
  const toggle = useCartStore((s) => s.toggle);
  const count = useCartStore((s) => s.cart?.totalQuantity ?? 0);
  const cartItems = useCartStore((s) => s.cart?.lines?.edges?.map((line) => line.node.merchandise.product.handle) ?? null);

  const handleClick = () => {
    toggle();
    trackActivity({
      eventType: "cart_opened",
      eventProperties: {
        cart_count: count,
        cart_items: cartItems,
        source: "cart_icon_button" // for analytics purposes later - track the trigger of the cart opened event
      },
    });
  };
  return (
    <button
      type="button"
      className="relative p-2 rounded-md text-secondary hover:text-primary hover:bg-surface-2 transition-soft min-w-[44px] min-h-[44px] flex items-center justify-center"
      onClick={handleClick}
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