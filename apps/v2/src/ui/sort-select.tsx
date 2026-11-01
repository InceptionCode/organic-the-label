import { useId } from 'react'
import { cn } from './cn'

type Option<T extends string> = { value: T; label: string }

type SortSelectProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  label?: string
  /** Visible prefix before the current value ("Sort: Newest first"). */
  prefix?: string
  className?: string
}

export function SortSelect<T extends string>({ value, onChange, options, label = 'Sort by', prefix = 'Sort', className }: SortSelectProps<T>) {
  const id = useId()
  const current = options.find((o) => o.value === value)?.label ?? ''
  return (
    <div
      className={cn(
        'group relative inline-flex h-11 items-center gap-1.5 rounded-sm px-1 text-[0.9375rem] font-medium text-muted transition-colors duration-150 hover:text-primary has-[:focus-visible]:text-primary has-[:focus-visible]:underline has-[:focus-visible]:decoration-1 has-[:focus-visible]:underline-offset-[6px]',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span aria-hidden className="whitespace-nowrap">
        {prefix}: <span className="text-primary">{current}</span>
      </span>
      <ChevronDown className="size-4 shrink-0" />
      {/* Invisible native select over the whole trigger. */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2 text-primary">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
