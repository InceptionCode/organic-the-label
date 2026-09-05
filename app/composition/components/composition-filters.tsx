'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input, MultiSelectFilter, SortSelect } from '@/ui-components';
import { parseMultiValueParam, serializeMultiValueParam } from '@/utils/helpers/filter-query';

const RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const TAG_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'melodic', label: 'Melodic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'r&b', label: 'R&B' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'trap', label: 'Trap' },
  { value: 'dark', label: 'Dark' },
  { value: 'ost', label: 'OST' },
  { value: 'opium', label: 'Opium' },
  { value: 'rage', label: 'Rage' },
  { value: 'digital', label: 'Digital' },
];
const TAG_VALUES = TAG_OPTIONS.map((tag) => tag.value);

type FilterUpdate = {
  search?: string;
  range?: string;
  sort?: string;
  tags?: string[];
};

export default function CompositionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [range, setRange] = useState(searchParams.get('range') ?? 'all');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest');
  const [tags, setTags] = useState<string[]>(() =>
    parseMultiValueParam(searchParams.get('tags')).filter((tag) => TAG_VALUES.includes(tag)),
  );

  const push = useCallback(
    (update: FilterUpdate) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('after');

      if (update.search !== undefined) {
        if (update.search) params.set('search', update.search);
        else params.delete('search');
      }
      if (update.range !== undefined) {
        if (update.range && update.range !== 'all') params.set('range', update.range);
        else params.delete('range');
      }
      if (update.sort !== undefined) {
        if (update.sort && update.sort !== 'newest') params.set('sort', update.sort);
        else params.delete('sort');
      }
      if (update.tags !== undefined) {
        const serialized = serializeMultiValueParam(
          update.tags.filter((tag) => TAG_VALUES.includes(tag)),
        );
        if (serialized) params.set('tags', serialized);
        else params.delete('tags');
      }

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/composition?${qs}` : '/composition');
      });
    },
    [router, searchParams],
  );

  const hasActiveFilters = Boolean(
    search || range !== 'all' || sort !== 'newest' || tags.length,
  );

  const clearAll = () => {
    setSearch('');
    setRange('all');
    setSort('newest');
    setTags([]);
    startTransition(() => router.push('/composition'));
  };

  return (
    <section className="mb-10 space-y-4" aria-label="Filter loops">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-muted" aria-hidden />
        </span>
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            push({ search: event.target.value.trim() });
          }}
          placeholder="Search loops by name or description…"
          aria-label="Search loops"
          className="pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              push({ search: '' });
            }}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-soft hover:text-primary"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SortSelect
          value={range}
          onChange={(value) => {
            setRange(value);
            push({ range: value });
          }}
          options={RANGE_OPTIONS}
          className="w-full sm:w-auto"
        />
        <SortSelect
          value={sort}
          onChange={(value) => {
            setSort(value);
            push({ sort: value });
          }}
          options={SORT_OPTIONS}
          className="w-full sm:w-auto"
        />
        <MultiSelectFilter
          label="Tags"
          placeholder="Tags"
          options={TAG_OPTIONS}
          selectedValues={tags}
          onChange={(value) => {
            setTags(value);
            push({ tags: value });
          }}
          searchable
          triggerClassName="w-full sm:w-auto sm:min-w-[200px]"
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
        {isPending && <span className="text-body-s text-muted">Updating…</span>}
      </div>
    </section>
  );
}
