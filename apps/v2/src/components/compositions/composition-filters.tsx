import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Check, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  COMPOSITION_SEARCH_MAX,
  RANGE_OPTIONS,
  SORT_OPTIONS,
  TAG_OPTIONS,
  hasActiveCompositionFilters,
  normalizeCompositionTags,
  toCompositionListParams,
  validateCompositionSearch,
  type CompositionRange,
  type CompositionSearch,
  type CompositionTag,
} from '~/lib/composition-search'
import { compositionQueries } from '~/queries/compositions'
import { cn } from '~/ui/cn'
import { Drawer } from '~/ui/drawer'
import { MultiSelect } from '~/ui/multi-select'
import { SortSelect } from '~/ui/sort-select'

const SEARCH_DEBOUNCE_MS = 300

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const quietTrigger =
  'inline-flex h-11 items-center gap-2 rounded-sm px-1 text-[0.9375rem] font-medium text-muted transition-[color,transform] duration-150 hover:cursor-pointer hover:text-primary active:scale-[0.98]'

const sheetRow =
  'hairline-b flex min-h-13 w-full items-center justify-between text-left text-body-m transition-colors duration-150 hover:cursor-pointer active:opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-primary)]'

type Update = Partial<CompositionSearch>

/**
 * Search above the bar below xl, then the sticky "Loops" bar (Store's filter bar pattern): the count
 * on the left; from xl search, released, sort and tags inline; below xl one "Filters & sort" sheet.
 * URL-driven; defaults are omitted from the URL.
 */
export function CompositionFilters({ search: resolved }: { search: CompositionSearch }) {
  const navigate = useNavigate({ from: '/compositions/' })
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  // Same key the results read, so this is the cached list (undefined while the first load is pending).
  const { data } = useQuery(compositionQueries.list(toCompositionListParams(resolved)))
  // The controls follow the URL being loaded (router state.location), not the last resolved match:
  // while the loader runs, Route.useSearch() still holds the previous search, so a quick second tag
  // toggle computed from it would drop the first one.
  const latest = useRouterState({
    select: (s) => (s.location.pathname.replace(/\/+$/, '') === '/compositions' ? s.location.search : null),
  })
  const search = latest ? validateCompositionSearch(latest as Record<string, unknown>) : resolved
  const [sheetOpen, setSheetOpen] = useState(false)

  const update = (change: Update, replace = false) =>
    navigate({ search: (prev: CompositionSearch) => ({ ...prev, ...change }), replace, resetScroll: false })
  const clearAll = () => navigate({ to: '/compositions', search: {}, resetScroll: false })

  const tags = normalizeCompositionTags(search.tags)
  const range = search.range ?? 'all'
  const sort = search.sort ?? 'newest'
  const activeCount = (search.range ? 1 : 0) + (search.sort ? 1 : 0) + tags.length
  const setRange = (value: CompositionRange | 'all') => update({ range: value === 'all' ? undefined : value })
  const setSort = (value: 'newest' | 'oldest') => update({ sort: value === 'oldest' ? 'oldest' : undefined })
  const setTags = (values: CompositionTag[]) => {
    const next = normalizeCompositionTags(values.join(','))
    update({ tags: next.length > 0 ? next.join(',') : undefined })
  }
  const toggleTag = (tag: CompositionTag) => setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
  const commitSearch = (term: string) => update({ search: term.trim() || undefined }, true)

  return (
    // `contents`: no box of its own, so the sticky bar's containing block is <main>.
    <section data-testid="composition-filters" aria-label="Filter loops" className="contents">
      <div className="content-container pb-2 xl:hidden">
        <SearchBox id="composition-search-compact" value={search.search ?? ''} onCommit={commitSearch} className="w-full" />
      </div>

      <div className="hairline-t hairline-b sticky top-16 z-20 bg-canvas lg:top-[72px]">
        <div className="content-container flex min-h-14 items-center gap-6">
          <p className="flex min-w-0 flex-1 items-baseline gap-3">
            <span className="text-h4 text-primary">Loops</span>
            {data && (
              <span className="text-label tabular-nums" aria-live="polite">
                {data.length}
                <span className="sr-only"> {data.length === 1 ? 'loop' : 'loops'}</span>
              </span>
            )}
            {isLoading && (
              <span role="status" className="text-label">
                Updating...
              </span>
            )}
          </p>

          <div className="hidden shrink-0 items-center gap-5 xl:flex">
            <SearchBox id="composition-search" value={search.search ?? ''} onCommit={commitSearch} className="w-56 2xl:w-64" />
            <SortSelect label="Date range" prefix="Released" value={range} options={RANGE_OPTIONS} onChange={setRange} />
            <SortSelect label="Sort" value={sort} options={SORT_OPTIONS} onChange={setSort} />
            <MultiSelect<CompositionTag> label="Tags" options={TAG_OPTIONS} selected={tags} onChange={setTags} />
            {hasActiveCompositionFilters(search) && (
              <button type="button" onClick={clearAll} className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-s text-primary hover:cursor-pointer', focusRing)}>
                Clear all
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            className={cn(quietTrigger, 'shrink-0 xl:hidden', activeCount > 0 && 'text-primary', focusRing)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            <span className="max-sm:sr-only">Filters &amp; sort</span>
            <span className="sm:hidden">Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-[color:var(--accent-primary)] px-1 text-[11px] font-semibold text-[color:var(--accent-contrast)]">
                <span className="sr-only">, </span>
                {activeCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
        </div>
      </div>
      <div aria-hidden className="h-6 md:h-8" />

      <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters & sort" placement="bottom" testId="composition-filters-drawer">
        <div className="space-y-8">
          <RadioRows legend="Released" options={RANGE_OPTIONS} value={range} onChange={setRange} />
          <RadioRows legend="Sort by" options={SORT_OPTIONS} value={sort} onChange={setSort} />

          <fieldset>
            <legend className="mb-2 text-label">Tags</legend>
            <div className="hairline-t grid grid-cols-2 gap-x-6">
              {TAG_OPTIONS.map((tag) => {
                const selected = tags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag.value)}
                    className={cn(sheetRow, 'gap-3', selected ? 'text-primary' : 'text-secondary hover:text-primary')}
                  >
                    <span>{tag.label}</span>
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[2px] border',
                        selected ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]' : 'border-[color:var(--border-strong)]',
                      )}
                    >
                      {selected && <Check className="size-3 text-[color:var(--accent-contrast)]" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex items-center gap-6 pt-1">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className={cn(
                'h-12 flex-1 rounded-sm bg-[color:var(--accent-primary)] text-[0.9375rem] font-medium text-[color:var(--accent-contrast)] transition-[background-color,transform] duration-150 hover:cursor-pointer hover:bg-[color:var(--accent-primary-hover)] active:scale-[0.98]',
                focusRing,
              )}
            >
              Show results
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => update({ range: undefined, sort: undefined, tags: undefined })}
                className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary hover:cursor-pointer', focusRing)}
              >
                Clear ({activeCount})
              </button>
            )}
          </div>
        </div>
      </Drawer>
    </section>
  )
}

function RadioRows<T extends string>({ legend, options, value, onChange }: { legend: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-label">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="hairline-t">
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(sheetRow, active ? 'text-primary' : 'text-secondary hover:text-primary')}
            >
              <span>{option.label}</span>
              {active && <Check className="size-4 text-[color:var(--accent-text)]" aria-hidden />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

type SearchBoxProps = { id: string; value: string; onCommit: (term: string) => void; className?: string }

function SearchBox({ id, value, onCommit, className }: SearchBoxProps) {
  const [draft, setDraft] = useState(value)
  const [seenUrlValue, setSeenUrlValue] = useState(value)
  const [lastCommitted, setLastCommitted] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Back/forward or "Clear all" changed the URL: show it, unless it is the echo of our own commit.
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
        Search loops
      </label>
      <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={id}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={COMPOSITION_SEARCH_MAX}
        placeholder="Search loops"
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
