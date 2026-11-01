import { formatMoney } from '~/lib/format'
import { cn } from './cn'

/** Shopify Money as a `price-text` span (v1 PriceDisplay). */
export function Price({ amount, currencyCode, className }: { amount: string; currencyCode: string; className?: string }) {
  return <span className={cn('price-text text-primary tabular-nums', className)}>{formatMoney(amount, currencyCode)}</span>
}
