import { cn } from '~/ui/cn'

/**
 * "Coming soon" label for membership promos while VITE_MEMBERSHIP_ENABLED is off. Flat, ink on the
 * sand band: 1px ink outline, 2px radius, Inter label size. Not a pill and not a button.
 */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] border border-[color:var(--band-sand-fg)] px-2 py-1 text-[0.75rem] font-medium leading-none text-[color:var(--band-sand-fg)]',
        className,
      )}
    >
      Coming soon
    </span>
  )
}
