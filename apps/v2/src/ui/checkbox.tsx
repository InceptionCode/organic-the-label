import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from './cn'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  /** Visible label. The whole row is the hit area (at least 44px tall). */
  children: ReactNode
  /** `light` for beige or white cards (home email card), `dark` for the default canvas. */
  tone?: 'dark' | 'light'
  labelClassName?: string
}

export function Checkbox({ children, tone = 'dark', className, labelClassName, id: idProp, ...props }: CheckboxProps) {
  const autoId = useId()
  const id = idProp ?? `checkbox-${autoId}`
  return (
    <label htmlFor={id} className={cn('group/cb flex min-h-11 cursor-pointer items-start gap-3 py-1', labelClassName)}>
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          {...props}
          id={id}
          type="checkbox"
          className={cn(
            // Flat: 1px border, 2px radius, red fill when checked (design-direction.md "Forms").
            'peer size-5 shrink-0 cursor-pointer appearance-none rounded-[2px] border transition-[background-color,border-color] duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2',
            'checked:border-[color:var(--accent-primary)] checked:bg-[color:var(--accent-primary)] active:scale-95',
            'aria-invalid:border-[color:var(--accent-text)]',
            tone === 'light'
              ? 'border-[rgba(7,7,7,0.3)] bg-white hover:border-[rgba(7,7,7,0.5)] focus-visible:ring-offset-[#F7F3EB]'
              : 'border-[color:var(--border-strong)] bg-transparent hover:border-[color:var(--text-primary)] focus-visible:ring-offset-[color:var(--bg-canvas)]',
            className,
          )}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 11 8"
          fill="none"
          className="pointer-events-none absolute h-2 w-[11px] opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
        >
          <path d="M1 3.5L4 6.5L10 1" stroke="#F7F3EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  )
}
