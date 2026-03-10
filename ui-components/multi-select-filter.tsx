'use client';

import { useState, useMemo, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MultiSelectOption } from '@/lib/filters/types';

type MultiSelectFilterProps = {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  maxVisibleSelectedLabels?: number;
  searchable?: boolean;
};

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  maxVisibleSelectedLabels = 2,
  searchable = false,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  const toggleValue = useCallback(
    (value: string) => {
      const next = selectedSet.has(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(next);
    },
    [onChange, selectedSet, selectedValues],
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const selectedOptions = options.filter((option) =>
    selectedSet.has(option.value),
  );

  const triggerText = useMemo(() => {
    if (selectedOptions.length === 0) return placeholder ?? label;

    const labels = selectedOptions.map((option) => option.label);
    if (labels.length <= maxVisibleSelectedLabels) {
      return `${label}: ${labels.join(', ')}`;
    }

    const visible = labels.slice(0, maxVisibleSelectedLabels).join(', ');
    const remaining = labels.length - maxVisibleSelectedLabels;
    return `${label}: ${visible} +${remaining}`;
  }, [label, placeholder, selectedOptions, maxVisibleSelectedLabels]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-11 min-w-[220px] items-center justify-between gap-3 rounded-md border border-default bg-surface-1 px-3 text-body-s text-primary shadow-sm outline-none transition hover:border-[color:var(--accent-primary)]/60 hover:bg-surface-1/80 focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]',
            className,
            triggerClassName,
          )}
          aria-label={label}
        >
          <span className="truncate text-left">
            <span
              className={cn(
                selectedValues.length === 0
                  ? 'text-secondary'
                  : 'text-primary',
              )}
            >
              {triggerText}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {selectedValues.length > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {selectedValues.length}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-secondary" />
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] min-w-[260px] overflow-hidden rounded-xl border border-default bg-surface-1 p-2 text-primary shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            contentClassName,
          )}
        >
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">
              {label}
            </div>

            <button
              type="button"
              onClick={clearAll}
              disabled={selectedValues.length === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-secondary transition hover:bg-surface-2 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          {searchable && (
            <div className="px-2 pb-2 text-white">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-9 w-full rounded-md border border-default bg-surface-1 px-3 text-body-s text-white outline-none placeholder:text-white focus:border-[color:var(--accent-primary)]"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-body-s text-secondary">
                No results found
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedSet.has(option.value);

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() =>
                          !option.disabled && toggleValue(option.value)
                        }
                        disabled={option.disabled}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-body-s transition',
                          'hover:bg-surface-2',
                          isSelected && 'bg-surface-2',
                          option.disabled &&
                          'cursor-not-allowed opacity-40',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-[4px] border transition',
                              isSelected
                                ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-primary'
                                : 'border-default bg-transparent text-transparent',
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>

                          <span className="truncate text-primary">
                            {option.label}
                          </span>
                        </div>

                        {typeof option.count === 'number' && (
                          <span className="ml-3 shrink-0 text-[11px] text-secondary">
                            {option.count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

