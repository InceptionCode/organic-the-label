import { useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { applyFilterUpdate, hasActiveFilters, type FilterUpdate, type StoreSearch } from '~/lib/store-search'
import { cn } from '~/ui/cn'
import { FilterBar } from './filter-bar'

const SEARCH_DEBOUNCE_MS = 300

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

/**
 * Search, the sticky filter bar, and the clear/updating row. Search sits in the bar from xl and in
 * its own row above the bar below xl, so it never needs the filter sheet. Both instances read the URL.
 */
export function StoreFilters({ search }: { search: StoreSearch }) {
  const navigate = useNavigate({ from: '/store/' })
  const isLoading = useRouterState({ select: (s) => s.isLoading })

  const update = (change: FilterUpdate, replace = false) =>
    navigate({ search: (prev: StoreSearch) => applyFilterUpdate(prev, change), replace, resetScroll: false })

  const commitSearch = (term: string) => update({ search: term }, true)

  return (
    // `contents`: no box of its own, so the sticky bar's containing block is <main>, not this wrapper.
    <div data-testid="store-filters" className="contents">
      <div className="content-container pb-2 xl:hidden">
        <SearchBox id="store-search-compact" value={search.search ?? ''} onCommit={commitSearch} className="w-full" />
      </div>
      <FilterBar
        search={search}
        onChange={(change) => update(change)}
        searchSlot={<SearchBox id="store-search" value={search.search ?? ''} onCommit={commitSearch} className="w-56 2xl:w-64" />}
      />
      <div className="content-container flex min-h-12 items-center justify-between gap-4 empty:hidden">
        {isLoading ? <span role="status" className="text-label">Updating...</span> : <span />}
        {hasActiveFilters(search) && (
          <button
            type="button"
            onClick={() => navigate({ to: '/store', search: {}, resetScroll: false })}
            className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary hover:cursor-pointer', focusRing)}
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}

type SearchBoxProps = { id: string; value: string; onCommit: (term: string) => void; className?: string }

function SearchBox({ id, value, onCommit, className }: SearchBoxProps) {
  const [draft, setDraft] = useState(value)
  const [seenUrlValue, setSeenUrlValue] = useState(value)
  const [lastCommitted, setLastCommitted] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (value !== seenUrlValue) {
    setSeenUrlValue(value)
    if (value !== lastCommitted) setDraft(value)
  }

  const commit = (term: string) => {
    clearTimeout(timer.current)
    setLastCommitted(term.trim())
    onCommit(term)
  }

  const onChange = (term: string) => {
    setDraft(term)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(term), SEARCH_DEBOUNCE_MS)
  }

  return (
    <form role="search" className={cn('relative', className)} onSubmit={(e) => (e.preventDefault(), commit(draft))}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={id}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={100}
        placeholder="Search products"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border-0 border-b border-[color:var(--border-default)] bg-transparent pl-7 pr-10 text-base text-primary outline-none transition-colors duration-150 placeholder:text-muted hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--text-primary)] focus-visible:shadow-[inset_0_-2px_0_var(--accent-primary)] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft('')
            commit('')
          }}
          className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-[color,transform] duration-150 hover:cursor-pointer hover:text-primary active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </form>
  )
}
