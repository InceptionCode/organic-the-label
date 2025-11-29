import StoreContent from '@/app/store/components/store-content';
import StoreFilters from '@/app/store/components/store-filters';
import StoreLayout from '@/app/store/store-layout';
import { Suspense } from 'react';

// HTML is per-request (because membership can change)

/**
 * Store page component that displays products with filtering and sorting
 */

export default function StorePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]> | Promise<Record<string, string | string[]>>;
}) {
  return (
    <StoreLayout>
      <Suspense fallback={<div className="mb-8 h-32 bg-gray-900 rounded animate-pulse" />}>
        <StoreFilters />
      </Suspense>
      {/* Render dynamic cart widget */}
      {/* Render Membership content (including upsell) */}
      {/* Render user content (recommendations, deals, and saved personalized data per user including anon data */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-muted-foreground text-lg mb-4">Loading store...</div>
          </div>
        }
      >
        <StoreContent searchParams={searchParams} />
      </Suspense>
    </StoreLayout>
  );
}
