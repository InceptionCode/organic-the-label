'use client';

import { Button } from '@/ui-components/button';

type QuantityControlProps = {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove?: () => void;
  min?: number;
  disabled?: boolean;
};

export function QuantityControl({
  quantity,
  onDecrement,
  onIncrement,
  onRemove,
  min = 1,
  disabled = false,
}: QuantityControlProps) {
  const atMin = quantity <= min;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Decrease quantity"
        onClick={onDecrement}
        disabled={atMin || disabled}
        className="h-8 w-8 shrink-0"
      >
        −
      </Button>
      <span className="meta min-w-[2ch] text-center tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Increase quantity"
        onClick={onIncrement}
        disabled={disabled}
        className="h-8 w-8 shrink-0"
      >
        +
      </Button>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="ml-2 text-muted hover:text-primary text-body-s"
        >
          Remove
        </Button>
      )}
    </div>
  );
}
