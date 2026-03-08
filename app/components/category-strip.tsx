'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'kit', label: 'Kits' },
  { value: 'pack', label: 'Packs' },
  { value: 'beat', label: 'Beats' },
  { value: 'merch', label: 'Merch' },
  { value: 'bank', label: 'Sound Banks' },
  { value: 'suite', label: 'Suites' },
  { value: 'plugin', label: 'Plugins' },
];

type CategoryStripProps = {
  className?: string;
};

export function CategoryStrip({ className = '' }: CategoryStripProps) {
  const searchParams = useSearchParams();
  const current = searchParams.get('category') || 'all';

  return (
    <div className={cn('overflow-x-auto py-2 -mx-4 px-4 md:mx-0 md:px-0', className)}>
      <div className="flex gap-2 min-w-max md:flex-wrap">
        {categories.map((cat) => {
          const params = new URLSearchParams(searchParams.toString());
          if (cat.value === 'all') params.delete('category');
          else params.set('category', cat.value);
          const href = `/store?${params.toString()}`;
          const isActive = current === cat.value;

          return (
            <Link
              key={cat.value}
              href={href}
              className={cn(
                'eyebrow px-4 py-2 rounded-full whitespace-nowrap transition-soft',
                isActive
                  ? 'bg-[color:var(--accent-primary-soft)] text-[color:var(--accent-primary)]'
                  : 'bg-surface-2 text-secondary hover:bg-surface-3 hover:text-primary',
              )}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
