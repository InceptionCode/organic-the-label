'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/ui-components';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useTransition } from 'react';

import { parseMultiValueParam, serializeMultiValueParam } from '@/utils/helpers/filter-query';
import { FilterBar } from './filter-bar';
import { ProductCategories, ProductTags as TagOptions } from '@/lib/schemas';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';
type CategoryFilter = ProductCategories | 'all';

const TagOptionsArray: TagOptions[] = ['ambient', 'melodic', 'vintage', 'r&b', 'hiphop', 'trap', 'dark', 'ost', 'opium', 'rage', 'digital'];

const categories: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'kit', label: 'Kits' },
  { value: 'pack', label: 'Packs' },
  { value: 'beat', label: 'Beats' },
  { value: 'merch', label: 'Merch' },
  { value: 'bank', label: 'Sound Banks' },
  { value: 'suite', label: 'Suites' },
  { value: 'plugin', label: 'Plugins & VSTs' },
];

const tagOptions: { value: TagOptions; label: string }[] = [
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

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

export default function StoreFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState<CategoryFilter>(
    (searchParams.get('category') as CategoryFilter) || 'all',
  );

  const [tags, setTags] = useState<TagOptions[]>(() => {
    const value = searchParams.get('tags');
    const parsed = parseMultiValueParam(value);
    return parsed.filter((t): t is TagOptions => TagOptionsArray.includes(t as TagOptions));
  });

  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest',
  );

  const [exclusiveOnly, setExclusiveOnly] = useState(searchParams.get('exclusive') === 'true');

  // Update URL params when filters change
  const updateFilters = (updates: {
    search?: string;
    category?: CategoryFilter;
    tags?: string[];
    sort?: SortOption;
    exclusive?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('after')

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
      } else {
        params.delete('search');
      }
    }

    if (updates.category !== undefined) {
      if (updates.category === 'all') {
        params.delete('category');
      } else {
        params.set('category', updates.category);
      }
    }

    if (updates.tags !== undefined) {
      const normalizedTags = updates.tags
        .filter((tag): tag is TagOptions => TagOptionsArray.includes(tag as TagOptions));

      const serialized = serializeMultiValueParam(normalizedTags);

      if (!serialized) {
        params.delete('tags');
      } else {
        params.set('tags', serialized);
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort === 'newest') {
        params.delete('sort');
      } else {
        params.set('sort', updates.sort);
      }
    }

    if (updates.exclusive !== undefined) {
      if (updates.exclusive) {
        params.set('exclusive', 'true');
      } else {
        params.delete('exclusive');
      }
    }

    // Reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/store?${params.toString()}`);
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters({ search: value });
  };

  const handleCategoryChange = (value: CategoryFilter) => {
    setCategory(value);
    updateFilters({ category: value });
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    updateFilters({ sort: value });
  };

  const handleTagsChange = (values: TagOptions[]) => {
    const nextTags = values.filter((tag) =>
      TagOptionsArray.includes(tag),
    );

    setTags(nextTags);
    updateFilters({ tags: nextTags });
  };

  const handleExclusiveToggle = (checked: boolean) => {
    setExclusiveOnly(checked);
    updateFilters({ exclusive: checked });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSort('newest');
    setExclusiveOnly(false);
    startTransition(() => {
      router.push('/store');
    });
  };

  const hasActiveFilters = search || category !== 'all' || sort !== 'newest' || exclusiveOnly;

  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-muted" aria-hidden="true" />
        </div>
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 w-full text-white placeholder:text-white"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <FilterBar
        categories={categories}
        selectedCategory={category}
        onCategoryChange={handleCategoryChange}
        exclusiveOnly={exclusiveOnly}
        onExclusiveToggle={handleExclusiveToggle}
        tagOptions={tagOptions}
        selectedTags={tags}
        onTagsChange={handleTagsChange}
        sortOptions={sortOptions}
        sortValue={sort}
        onSortChange={handleSortChange}
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all filters
          </Button>
          {isPending && <span className="text-body-s text-muted">Updating...</span>}
        </div>
      )}
    </div>
  );
}
