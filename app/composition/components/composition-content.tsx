import Link from 'next/link';
import { Button, EmptyState } from '@/ui-components';
import { COMPOSITION_PAGE_COUNT } from '@/lib/schemas';
import { getCachedCompositions } from '@/lib/composition/compositions-cache';
import {
  getNormalizedCompositionSearchParams,
  type RawCompositionSearchParams,
} from '@/lib/composition/normalize-search-params';
import { CompositionGrid } from './composition-grid';

export default async function CompositionContent({
  searchParams,
}: {
  searchParams: RawCompositionSearchParams | Promise<RawCompositionSearchParams>;
}) {
  const raw = await searchParams;
  const params = getNormalizedCompositionSearchParams(raw);
  const { compositions, error } = await getCachedCompositions(params);

  const hasFilters = Boolean(params.search || params.tags?.length || params.range !== 'all');

  if (error) {
    return (
      <EmptyState
        title="Couldn't load the loops"
        description="Something went wrong on our end. Refresh the page or try again in a moment."
      />
    );
  }

  if (!compositions.length) {
    return (
      <EmptyState
        title={hasFilters ? 'No loops match your filters' : 'No loops posted yet'}
        description={
          hasFilters
            ? 'Try a wider date range or clearing a tag.'
            : 'Check back soon — new previews land here regularly.'
        }
        action={
          hasFilters ? (
            <Button asChild variant="ghost">
              <Link href="/composition">Reset filters</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <CompositionGrid compositions={compositions} />
      <div className="mt-12 border-t border-subtle pt-8 text-center text-body-s text-muted">
        Showing {compositions.length} {compositions.length === 1 ? 'loop' : 'loops'}
        {compositions.length === COMPOSITION_PAGE_COUNT ? ' — filter to narrow further' : ''}
      </div>
    </>
  );
}
