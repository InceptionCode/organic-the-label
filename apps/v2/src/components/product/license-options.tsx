import type { LicenseOption } from '~/server/shopify/types'
import { cn } from '~/ui/cn'
import { Price } from '~/ui/price'

type LicenseOptionsProps = {
  options: LicenseOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Beat licenses as hairline radio rows (name left, price right); the selected row gets a red left bar
 * and bone text. Single-variant products render nothing: the price already sits under the title.
 */
export function LicenseOptions({ options, selectedId, onSelect }: LicenseOptionsProps) {
  if (options.length <= 1) return null

  return (
    <fieldset>
      <legend className="mb-3 text-label">License</legend>
      <div className="border-b border-[color:var(--border-subtle)]">
        {options.map((opt) => {
          const checked = selectedId === opt.id
          return (
            <label
              key={opt.id}
              className={cn(
                'relative flex min-h-14 items-center justify-between gap-4 border-t border-[color:var(--border-subtle)] pl-4 pr-1 transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[color:var(--accent-primary)]',
                checked ? 'text-primary' : 'text-secondary',
                opt.availableForSale ? 'cursor-pointer hover:text-[color:var(--text-primary)]' : 'cursor-not-allowed opacity-50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute inset-y-2 left-0 w-0.5 origin-center bg-[color:var(--accent-primary)] transition-transform duration-200 ease-[var(--ease-spring)]',
                  checked ? 'scale-y-100' : 'scale-y-0',
                )}
              />
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="license"
                  value={opt.id}
                  checked={checked}
                  disabled={!opt.availableForSale}
                  onChange={() => onSelect(opt.id)}
                  className="size-4 accent-[color:var(--accent-primary)] outline-none"
                />
                <span className="text-body-m font-medium">
                  {opt.title}
                  {!opt.availableForSale && <span className="sr-only"> (unavailable)</span>}
                </span>
              </span>
              <Price amount={opt.price.amount} currencyCode={opt.price.currencyCode} className={cn('text-body-m', !checked && 'text-secondary')} />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
