import { cn } from './cn'

type QuantityControlProps = {
  quantity: number
  onDecrement: () => void
  onIncrement: () => void
  /** When set, renders a "Remove" button after the stepper (cart rows). */
  onRemove?: () => void
  min?: number
  max?: number
  disabled?: boolean
  /** id of the visible label, so the value is announced with it. */
  labelledBy?: string
  /** Item name appended to the button labels ("Decrease quantity of Wave Pack") where several steppers share a page. */
  itemName?: string
  /** `flat`: one hairline-bordered group, 56px tall (product page, beside a size="lg" button). */
  variant?: 'default' | 'flat'
  className?: string
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

// Default (cart drawer): the same hairline group as `flat`, compact at 44px.
const defaultGroup =
  'flex h-11 items-stretch rounded-[2px] border border-[color:var(--border-default)] has-[:focus-visible]:border-[color:var(--text-primary)]'

const flatGroup =
  'flex h-14 items-stretch rounded-[2px] border border-[color:var(--border-default)] has-[:focus-visible]:border-[color:var(--text-primary)]'

const flatStepButton = cn(
  'inline-flex w-11 shrink-0 items-center justify-center text-lg leading-none text-primary transition-colors duration-150 hover:cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--text-primary)_6%,transparent)] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)]',
)

const removeButton = cn(
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-[2px] px-2 text-body-s text-muted underline decoration-1 underline-offset-[6px] decoration-[color:color-mix(in_srgb,var(--text-primary)_25%,transparent)] transition-colors duration-150 hover:cursor-pointer hover:text-[color:var(--text-primary)] hover:decoration-[color:var(--accent-primary)] active:opacity-70 disabled:pointer-events-none disabled:opacity-40 touch-manipulation',
  focusRing,
)

/** Shared stepper (product page, cart drawer). 44px buttons; the value is a live region. */
export function QuantityControl({
  quantity,
  onDecrement,
  onIncrement,
  onRemove,
  min = 1,
  max = 99,
  disabled = false,
  labelledBy,
  itemName,
  variant = 'default',
  className,
}: QuantityControlProps) {
  const of = itemName ? ` of ${itemName}` : ''
  const flat = variant === 'flat'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div role="group" aria-labelledby={labelledBy} className={flat ? flatGroup : defaultGroup}>
        <button
          type="button"
          data-testid="qty-decrease"
          aria-label={`Decrease quantity${of}`}
          onClick={onDecrement}
          disabled={disabled || quantity <= min}
          className={flatStepButton}
        >
          <span aria-hidden>&minus;</span>
        </button>
        <output aria-live="polite" aria-labelledby={labelledBy} className="flex min-w-8 items-center justify-center text-body-s tabular-nums text-primary">
          {quantity}
        </output>
        <button
          type="button"
          data-testid="qty-increase"
          aria-label={`Increase quantity${of}`}
          onClick={onIncrement}
          disabled={disabled || quantity >= max}
          className={flatStepButton}
        >
          <span aria-hidden>+</span>
        </button>
      </div>
      {onRemove ? (
        <button type="button" data-testid="qty-remove" onClick={onRemove} disabled={disabled} className={removeButton}>
          Remove{itemName ? <span className="sr-only"> {itemName}</span> : null}
        </button>
      ) : null}
    </div>
  )
}
