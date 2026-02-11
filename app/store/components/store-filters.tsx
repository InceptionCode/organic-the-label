'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useTransition } from 'react';
import { Label } from '@/ui-components/label';

import { isEqual } from '@/utils/helpers/checks'

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';
type CategoryFilter = 'all' | 'kit' | 'pack' | 'beat' | 'merch' | 'bank' | 'suite' | 'plugin';
type TagOptions = 'all' | 'ambient' | 'melodic' | 'vintage' | 'r&b' | 'hiphop' | 'trap' | 'dark' | 'ost' | 'opium' | 'rage' | 'digital';

const TagOptionsArray = ['all', 'ambient', 'melodic', 'vintage', 'r&b', 'hiphop', 'trap', 'dark', 'ost', 'opium', 'rage', 'digital'];

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
  { value: 'all', label: 'All' },
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

  const [tags, setTags] = useState<TagOptions[]>(
    () => {
      const value = searchParams.get('tags') as TagOptions;
      if (!value) return ['all'];
      return value.split(',').map(t => t.trim()).filter(t => TagOptionsArray.includes(t)) as TagOptions[];
    }
  );

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
      if (updates.tags.includes('all') || isEqual(updates.tags, TagOptionsArray)) {
        params.delete('tags');
      } else {
        updates.tags.forEach(tag => params.append("tag", tag))
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

  const handleTagsChange = (value: TagOptions[]) => {
    setTags(value);
    updateFilters({ tags: value });
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
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-red-600 focus:ring-red-600"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat.value)}
              className={
                category === cat.value
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Sort and Tag Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Exclusive Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exclusiveOnly}
              onChange={(e) => handleExclusiveToggle(e.target.checked)}
              className="w-4 h-4 text-red-600 bg-gray-900 border-gray-700 rounded focus:ring-red-600 focus:ring-2"
            />
            <span className="text-sm text-gray-300">Exclusive Only</span>
          </label>

          {/* Tag Dropdown */}
          <Label htmlFor="tags">Tags</Label>
          <select
            name="tags"
            value={tags}
            onChange={(e) => handleTagsChange(e.target.value as unknown as TagOptions[])}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            multiple
          >
            {tagOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white"
          >
            Clear all filters
          </Button>
          {isPending && <span className="text-sm text-gray-400">Updating...</span>}
        </div>
      )}
    </div>
  );
}
