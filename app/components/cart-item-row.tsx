'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CartLine } from '@/lib/schemas';
import { PriceDisplay } from './price-display';
import { QuantityControl } from './quantity-control';

type CartItemRowProps = {
  line: CartLine;
  onSetQty: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  disabled?: boolean;
};

export function CartItemRow({ line, onSetQty, onRemove, disabled }: CartItemRowProps) {
  const img = line.merchandise.image;
  const price = line.merchandise.price;
  const productUrl = `/store/${line.merchandise.product.handle}`;

  return (
    <div className="grid grid-cols-[72px_1fr] gap-4 py-4 border-b border-subtle last:border-b-0">
      <div className="relative w-[72px] h-[72px] shrink-0 rounded-md overflow-hidden bg-surface-3">
        {img?.url ? (
          <Image
            src={img.url}
            alt={img.altText ?? line.merchandise.product.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-2" />
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <div>
          <Link
            href={productUrl}
            className="text-h5 text-primary hover:text-secondary transition-soft line-clamp-2"
          >
            {line.merchandise.product.title}
          </Link>
          {line.merchandise.title && line.merchandise.title !== 'Default Title' && (
            <p className="meta mt-0.5">{line.merchandise.title}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
          <PriceDisplay amount={price.amount} currencyCode={price.currencyCode} className="text-body-m" />
          <QuantityControl
            quantity={line.quantity}
            onDecrement={() => onSetQty(line.id, line.quantity - 1)}
            onIncrement={() => onSetQty(line.id, line.quantity + 1)}
            onRemove={() => onRemove(line.id)}
            min={1}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
