import { Suspense } from 'react';
import { SkeletonCard } from '@/ui-components';
import CompositionLayout from './composition-layout';
import CompositionFilters from './components/composition-filters';
import CompositionContent from './components/composition-content';

export const metadata = {
  title: 'Composition – Organic Sonics',
  description:
    'Free original loops and samples. Preview them on Instagram and YouTube, then download the full loop plus terms of use as an instant zip.',
};

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function CompositionPage({
  searchParams,
}: {
  searchParams:
    | Record<string, string | string[]>
    | Promise<Record<string, string | string[]>>;
}) {
  return (
    <CompositionLayout>
      <Suspense
        fallback={<div className="mb-10 h-32 animate-pulse rounded-lg bg-surface-2" />}
      >
        <CompositionFilters />
      </Suspense>
      <Suspense fallback={<GridSkeleton />}>
        <CompositionContent searchParams={searchParams} />
      </Suspense>
    </CompositionLayout>
  );
}
