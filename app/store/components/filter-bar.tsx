'use client';

import { useState } from 'react';
import { Button, MultiSelectFilter, SortSelect, Drawer } from '@/ui-components';
import { ProductCategories, ProductTags as TagOptions } from '@/lib/schemas';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Check } from 'lucide-react';

type CategoryFilter = ProductCategories | 'all';
type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

type Category = { value: CategoryFilter; label: string };
type TagOption = { value: TagOptions; label: string };

type FilterBarProps = {
  categories: Category[];
  selectedCategory: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  exclusiveOnly: boolean;
  onExclusiveToggle: (checked: boolean) => void;
  tagOptions: TagOption[];
  selectedTags: TagOptions[];
  onTagsChange: (values: TagOptions[]) => void;
  sortOptions: { value: SortOption; label: string }[];
  sortValue: SortOption;
  onSortChange: (value: SortOption) => void;
};

export function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  exclusiveOnly,
  onExclusiveToggle,
  tagOptions,
  selectedTags,
  onTagsChange,
  sortOptions,
  sortValue,
  onSortChange,
}: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeFilterCount =
    selectedTags.length +
    (sortValue !== 'newest' ? 1 : 0) +
    (exclusiveOnly ? 1 : 0);

  return (
    <>
      {/* ── Mobile Layout (< md) ── */}
      <div className="md:hidden space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={[
                'flex-none px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                selectedCategory === cat.value
                  ? 'bg-[color:var(--accent-primary)] text-white shadow-sm'
                  : 'bg-[color:var(--surface-1)] border border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent-primary)]/50',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => setDrawerOpen(true)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200',
              activeFilterCount > 0
                ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--text-primary)]'
                : 'border-[color:var(--border-default)] bg-[color:var(--surface-1)] text-[color:var(--text-primary)]',
            ].join(' ')}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[color:var(--accent-primary)] text-white text-[11px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Desktop Layout (md+) ── */}
      <div className="hidden md:flex gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exclusiveOnly}
              onChange={(e) => onExclusiveToggle(e.target.checked)}
              className="w-4 h-4 rounded border-default bg-surface-1 text-primary focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            />
            <span className="text-body-s text-secondary">Exclusive Only</span>
          </label>

          <MultiSelectFilter
            label="Tags"
            placeholder="Tags"
            options={tagOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            selectedValues={selectedTags}
            onChange={(next) => onTagsChange(next as TagOptions[])}
            searchable={tagOptions.length > 8}
            triggerClassName="min-w-[200px]"
          />

          <SortSelect
            value={sortValue}
            onChange={(value) => onSortChange(value as SortOption)}
            options={sortOptions}
          />
        </div>
      </div>

      {/* ── Mobile Filter Drawer (bottom sheet) ── */}
      <Drawer
        isOpen={drawerOpen}
        placement="bottom"
        onClose={() => setDrawerOpen(false)}
        className="pt-2"
      >
        <div className="space-y-6">
          <div className="flex justify-center -mt-2 mb-2">
            <div className="w-10 h-1 rounded-full bg-[color:var(--border-default)]" />
          </div>

          <h3 className="text-body-l font-semibold text-primary">Filters</h3>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
              Sort By
            </p>
            <div className="grid grid-cols-1 gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={[
                    'flex items-center justify-between w-full px-4 py-3 rounded-xl border text-left transition-all duration-150',
                    sortValue === option.value
                      ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/8 text-[color:var(--text-primary)]'
                      : 'border-[color:var(--border-default)] bg-[color:var(--surface-1)] text-[color:var(--text-secondary)]',
                  ].join(' ')}
                >
                  <span className="text-sm">{option.label}</span>
                  {sortValue === option.value && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[color:var(--accent-primary)]">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[color:var(--border-default)]" />

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const isSelected = selectedTags.includes(tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => {
                      const next = isSelected
                        ? selectedTags.filter((t) => t !== tag.value)
                        : [...selectedTags, tag.value];
                      onTagsChange(next);
                    }}
                    className={[
                      'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                      isSelected
                        ? 'bg-[color:var(--accent-primary)] text-white'
                        : 'bg-[color:var(--surface-1)] border border-[color:var(--border-default)] text-[color:var(--text-secondary)]',
                    ].join(' ')}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[color:var(--border-default)]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--text-primary)]">Exclusive Only</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">Show exclusive releases</p>
            </div>
            <button
              onClick={() => onExclusiveToggle(!exclusiveOnly)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                exclusiveOnly
                  ? 'bg-[color:var(--accent-primary)]'
                  : 'bg-[color:var(--surface-2)]',
              ].join(' ')}
              aria-checked={exclusiveOnly}
              role="switch"
            >
              <span
                className={[
                  'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                  exclusiveOnly ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  onSortChange('newest');
                  onTagsChange([]);
                  onExclusiveToggle(false);
                }}
                className="flex-1 py-3 rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface-1)] text-sm font-semibold text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
              >
                Clear ({activeFilterCount})
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-3 rounded-xl bg-[color:var(--accent-primary)] text-white text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
            >
              Apply
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
