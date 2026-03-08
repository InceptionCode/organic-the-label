'use client';

import { cn } from '@/lib/utils';

export type LicenseOption = {
  id: string;
  title: string;
  price: string;
  currencyCode: string;
  availableForSale: boolean;
};

type LicenseOptionsProps = {
  options: LicenseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function LicenseOptions({ options, selectedId, onSelect, disabled }: LicenseOptionsProps) {
  if (options.length === 0) return null;
  if (options.length === 1) {
    return (
      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-body-s text-secondary">{options[0].title}</p>
        <p className="price-text text-primary mt-1">
          {options[0].currencyCode} {options[0].price}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="eyebrow text-secondary">License</p>
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || !opt.availableForSale}
            onClick={() => onSelect(opt.id)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-soft',
              selectedId === opt.id
                ? 'border-strong bg-surface-2 text-primary'
                : 'border-subtle bg-surface-1 text-secondary hover:border-default hover:bg-surface-2',
              (!opt.availableForSale || disabled) && 'opacity-60 cursor-not-allowed',
            )}
          >
            <span className="text-body-m font-medium">{opt.title}</span>
            <span className="price-text">
              {opt.currencyCode} {opt.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
