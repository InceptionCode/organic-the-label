import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { SEARCH_Q_MAX } from '~/lib/search-query'
import { Button } from '~/ui/button'

/**
 * The page's hero: one large underline field. Native GET form (works without JavaScript: a full
 * navigation to /search?q=). With JS, submit is intercepted and handled by the router. Render with
 * `key={q}` so a new query resets the input.
 */
export function SearchForm({ q }: { q?: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(q ?? '')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = value.trim().replace(/\s+/g, ' ')
    // A new query starts on "All"; the type tab only filters the results of the current query.
    void navigate({ to: '/search', search: { q: next || undefined, type: undefined } })
  }

  // Clearing (the x, or emptying the field) drops `q` and `type` right away and shows the no-query state.
  // `replace` so Back does not land on a blank intermediate entry. The form remounts (keyed by q) with
  // autoFocus, so focus stays in the field.
  function clear() {
    setValue('')
    inputRef.current?.focus()
    if (q) void navigate({ to: '/search', search: { q: undefined, type: undefined }, replace: true })
  }

  return (
    <form method="get" action="/search" role="search" onSubmit={onSubmit} className="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
      <label htmlFor="site-search" className="sr-only">
        Search
      </label>
      {/* Underline field: the bottom border brightens and thickens (box-shadow, no layout shift) on focus. */}
      <div className="relative min-w-0 flex-1 border-b border-[color:var(--border-strong)] transition-[border-color,box-shadow] duration-150 hover:border-[color:color-mix(in_srgb,var(--text-primary)_50%,transparent)] has-[:focus-visible]:border-[color:var(--text-primary)] has-[:focus-visible]:shadow-[0_1px_0_0_var(--text-primary)]">
        <Search aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 size-6 -translate-y-1/2 text-muted md:size-7" />
        <input
          ref={inputRef}
          id="site-search"
          name="q"
          type="search"
          value={value}
          onChange={(e) => {
            if (e.target.value.trim() === '') clear()
            else setValue(e.target.value)
          }}
          maxLength={SEARCH_Q_MAX}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          autoFocus={!q}
          placeholder="Kits, packs, loops, genres..."
          className="w-full bg-transparent py-4 pl-10 pr-12 text-[length:clamp(1.5rem,4vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-primary placeholder:text-muted focus-visible:outline-none md:pl-12 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clear}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:cursor-pointer hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] active:scale-95"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      <Button type="submit" size="lg" variant="outline" className="w-full sm:w-auto">
        Search
      </Button>
    </form>
  )
}
