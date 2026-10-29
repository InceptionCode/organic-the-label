import { useState, type ReactNode } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import {
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  TAG_OPTIONS,
  activeFilterCount,
  type FilterUpdate,
  type StoreSearch,
  type StoreSort,
  type StoreTag,
} from '~/lib/store-search'
import { cn } from '~/ui/cn'
import { Drawer } from '~/ui/drawer'
import { MultiSelect } from '~/ui/multi-select'
import { SortSelect } from '~/ui/sort-select'

type FilterBarProps = {
  search: StoreSearch
  onChange: (update: FilterUpdate) => void
  /** The inline search field, shown in the bar from xl. */
  searchSlot: ReactNode
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-canvas)]'

const quietTrigger =
  'inline-flex h-11 items-center gap-2 rounded-sm px-1 text-[0.9375rem] font-medium text-muted transition-[color,transform] duration-150 hover:cursor-pointer hover:text-primary active:scale-[0.98]'

/**
 * Sticky full-width bar under the navbar: category tabs on the left; from xl, search, tags,
 * exclusive and sort inline on the right. Below xl one "Filters & sort" button opens the sheet.
 */
export function FilterBar({ search, onChange, searchSlot }: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const category = search.category ?? 'all'
  const tags = (search.tags ? search.tags.split(',') : []) as StoreTag[]
  const sort: StoreSort = search.sort ?? 'newest'
  const exclusive = search.exclusive === true
  const count = activeFilterCount(search)

  const toggleTag = (tag: StoreTag) =>
    onChange({ tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] })

  return (
    <>
      <div className="hairline-t hairline-b sticky top-16 z-20 bg-canvas lg:top-[72px]">
        <div className="content-container flex items-center gap-6">
          <div
            role="group"
            aria-label="Category"
            className="no-scrollbar -ml-6 flex min-w-0 flex-1 gap-6 overflow-x-auto pl-6 pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] md:-ml-1 md:pl-1 xl:gap-7 xl:pr-0 xl:[mask-image:none]"
          >
            {CATEGORY_OPTIONS.map((cat) => {
              const active = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ category: cat.value })}
                  className={cn(
                    'relative flex h-14 flex-none items-center whitespace-nowrap rounded-sm text-[0.9375rem] font-medium transition-colors duration-150 hover:cursor-pointer active:opacity-70',
                    'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-[color:var(--accent-primary)] after:transition-transform after:duration-200 after:ease-[var(--ease-spring)]',
                    focusRing,
                    'focus-visible:ring-offset-0 focus-visible:ring-inset',
                    active ? 'text-primary after:scale-x-100' : 'text-muted hover:text-primary after:scale-x-0',
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* xl+: inline controls */}
          <div className="hidden shrink-0 items-center gap-5 xl:flex">
            {searchSlot}
            <MultiSelect label="Tags" options={TAG_OPTIONS} selected={tags} onChange={(next) => onChange({ tags: next })} />
            <ExclusiveSwitch id="exclusive-inline" checked={exclusive} onChange={(next) => onChange({ exclusive: next })} />
            <SortSelect value={sort} onChange={(value) => onChange({ sort: value })} options={SORT_OPTIONS} />
          </div>

          {/* Below xl: one sheet trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            className={cn(quietTrigger, 'shrink-0 xl:hidden', count > 0 && 'text-primary', focusRing)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            <span className="max-sm:sr-only">Filters &amp; sort</span>
            <span className="sm:hidden">Filters</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-[color:var(--accent-primary)] px-1 text-[11px] font-semibold text-[color:var(--accent-contrast)]">
                <span className="sr-only">, </span>
                {count}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter sheet (below xl) */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters & sort" placement="bottom" testId="filters-drawer">
        <div className="space-y-8">
          <fieldset>
            <legend className="mb-2 text-label">Sort by</legend>
            <div role="radiogroup" aria-label="Sort by" className="hairline-t">
              {SORT_OPTIONS.map((option) => {
                const active = sort === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange({ sort: option.value })}
                    className={cn(
                      'hairline-b flex min-h-13 w-full items-center justify-between text-left text-body-m transition-colors duration-150 hover:cursor-pointer active:opacity-70',
                      focusRing,
                      'focus-visible:ring-offset-0 focus-visible:ring-inset',
                      active ? 'text-primary' : 'text-secondary hover:text-primary',
                    )}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="size-4 text-[color:var(--accent-text)]" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </fieldset>

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
                    className={cn(
                      'hairline-b flex min-h-12 items-center justify-between gap-3 text-left text-body-m transition-colors duration-150 hover:cursor-pointer active:opacity-70',
                      focusRing,
                      'focus-visible:ring-offset-0 focus-visible:ring-inset',
                      selected ? 'text-primary' : 'text-secondary hover:text-primary',
                    )}
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

          <div className="hairline-t hairline-b flex min-h-14 items-center justify-between gap-4">
            <div>
              <p id="exclusive-switch-label" className="text-body-m text-primary">Exclusive only</p>
              <p id="exclusive-switch-hint" className="text-label">Show exclusive releases</p>
            </div>
            <ExclusiveSwitch id="exclusive-sheet" checked={exclusive} onChange={(next) => onChange({ exclusive: next })} labelledBy="exclusive-switch-label" describedBy="exclusive-switch-hint" />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'h-12 flex-1 rounded-sm bg-[color:var(--accent-primary)] text-[0.9375rem] font-medium text-[color:var(--accent-contrast)] transition-[background-color,transform] duration-150 hover:cursor-pointer hover:bg-[color:var(--accent-primary-hover)] active:scale-[0.98]',
                focusRing,
              )}
            >
              Show results
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={() => onChange({ sort: 'newest', tags: [], exclusive: false })}
                className={cn('link-underline inline-flex min-h-11 items-center rounded-sm text-body-m text-primary hover:cursor-pointer', focusRing)}
              >
                Clear ({count})
              </button>
            )}
          </div>
        </div>
      </Drawer>
    </>
  )
}

type ExclusiveSwitchProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  labelledBy?: string
  describedBy?: string
}

/** Flat switch. Inline it carries its own visible label; in the sheet the row text labels it. */
function ExclusiveSwitch({ id, checked, onChange, labelledBy, describedBy }: ExclusiveSwitchProps) {
  const inline = !labelledBy
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={cn(
        'group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-sm px-1 text-[0.9375rem] font-medium transition-colors duration-150 hover:cursor-pointer active:scale-[0.98]',
        checked ? 'text-primary' : 'text-muted hover:text-primary',
        focusRing,
      )}
    >
      {inline && <span>Exclusive</span>}
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-sm border transition-colors duration-200',
          checked ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]' : 'border-[color:var(--border-strong)] bg-transparent',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-[1px] transition-transform duration-200 ease-[var(--ease-spring)]',
            checked ? 'translate-x-[18px] bg-[color:var(--accent-contrast)]' : 'translate-x-[2px] bg-[color:var(--text-muted)]',
          )}
        />
      </span>
    </button>
  )
}
