'use client';

import { formatMoney } from "@/utils/helpers/product-helpers";

type PriceDisplayProps = {
  amount: string;
  currencyCode: string;
  className?: string;
};

export function PriceDisplay({ amount, currencyCode, className = '' }: PriceDisplayProps) {
  const formatted = formatMoney(amount, currencyCode)
  return <span className={`price-text text-primary ${className}`}>{formatted}</span>;
}
