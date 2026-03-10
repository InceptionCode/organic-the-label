import { Button, MultiSelectFilter, SortSelect } from '@/ui-components';
import { ProductCategories, ProductTags as TagOptions } from '@/lib/schemas';

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
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Category Filter */}
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

      {/* Sort and Tag Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Exclusive Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={exclusiveOnly}
            onChange={(e) => onExclusiveToggle(e.target.checked)}
            className="w-4 h-4 rounded border-default bg-surface-1 text-primary focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          />
          <span className="text-body-s text-secondary">Exclusive Only</span>
        </label>

        {/* Tags Multi-Select */}
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

        {/* Sort Dropdown */}
        <SortSelect
          value={sortValue}
          onChange={(value) => onSortChange(value as SortOption)}
          options={sortOptions}
        />
      </div>
    </div>
  );
}

