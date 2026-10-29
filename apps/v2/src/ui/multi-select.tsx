import { useEffect, useId, useRef, useState } from 'react'
import { cn } from './cn'
import { ChevronDown } from './sort-select'

type Option<T extends string> = { value: T; label: string }

type MultiSelectProps<T extends string> = {
  label: string
  options: Option<T>[]
  selected: T[]
  onChange: (values: T[]) => void
  className?: string
}

const triggerClasses =
  'inline-flex h-11 items-center gap-1.5 rounded-sm px-1 text-[0.9375rem] font-medium text-muted outline-none transition-[color,transform] duration-150 hover:cursor-pointer hover:text-primary active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] aria-expanded:text-[color:var(--text-primary)]'


export function MultiSelect<T extends string>({ label, options, selected, onChange, className }: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const text = selected.length === 0 ? label : `${label} (${selected.length})`
  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label)

  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={triggerClasses}
      >
        <span className={cn('whitespace-nowrap', selected.length > 0 && 'text-primary')}>{text}</span>
        {selectedLabels.length > 0 && <span className="sr-only">: {selectedLabels.join(', ')}</span>}
        <ChevronDown className={cn('size-4 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-sm border border-default bg-surface-2 p-2 text-primary shadow-float"
      >
        <div className="mb-1 flex items-center justify-between px-2 pt-1">
          <span className="text-label">{label}</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
            className="link-underline min-h-11 rounded-sm px-2 text-body-s text-secondary hover:cursor-pointer hover:text-primary disabled:pointer-events-none disabled:no-underline disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            Clear
          </button>
        </div>
        <fieldset className="grid max-h-80 grid-cols-2 gap-x-1 overflow-y-auto p-1">
          <legend className="sr-only">{label}</legend>
          {options.map((o) => {
            const checked = selected.includes(o.value)
            return (
              <label
                key={o.value}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 text-body-s text-secondary transition-colors duration-150 hover:bg-surface-3 hover:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--accent-primary)]',
                  checked && 'text-primary',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.value)}
                  className="size-4 shrink-0 cursor-pointer accent-[color:var(--accent-primary)] outline-none"
                />
                <span className="truncate">{o.label}</span>
              </label>
            )
          })}
        </fieldset>
      </div>
    </div>
  )
}
