export type CompositionRange = '7d' | '30d' | '90d' | 'year' | 'all';
export type CompositionSort = 'newest' | 'oldest';

export type RawCompositionSearchParams = {
  [key: string]: string | string[] | undefined;
};

export type NormalizedCompositionSearchParams = {
  search?: string;
  tags?: string[];
  range: CompositionRange;
  sort: CompositionSort;
};

const RANGES: CompositionRange[] = ['7d', '30d', '90d', 'year', 'all'];
const SORTS: CompositionSort[] = ['newest', 'oldest'];

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getNormalizedCompositionSearchParams(
  searchParams: RawCompositionSearchParams,
): NormalizedCompositionSearchParams {
  const rawRange = first(searchParams.range)?.toLowerCase();
  const rawSort = first(searchParams.sort)?.toLowerCase();
  const rawTags = first(searchParams.tags);

  const tags = rawTags
    ? Array.from(
        new Set(
          rawTags
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
        ),
      ).sort()
    : undefined;

  return {
    search: first(searchParams.search)?.toLowerCase(),
    tags: tags && tags.length ? tags : undefined,
    range: (RANGES.includes(rawRange as CompositionRange) ? rawRange : 'all') as CompositionRange,
    sort: (SORTS.includes(rawSort as CompositionSort) ? rawSort : 'newest') as CompositionSort,
  };
}

/**
 * Resolve a range preset to an ISO cutoff. Deterministic to the day so it plays
 * nicely with `unstable_cache` (revalidate 900).
 */
export function rangeToCutoffISO(range: CompositionRange, now: Date = new Date()): string | null {
  if (range === 'all') return null;

  if (range === 'year') {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}
