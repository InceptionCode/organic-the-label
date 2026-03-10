
export type NormalizedSearchParams = {
  search?: string;
  category?: string; // Product_type filter for Shopify
  tags?: string[];
  sort?: string;
  exclusive?: string;
};

export type ResolvedProductSearchParams = {
  after?: string | null;
  search?: string | null;
  category?: string | null; // Product_type filter for Shopify
  tags?: string[] | null;
  sort?: string | null;
  exclusive?: string | null;
}

export type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};

export function asStringArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function normalizeTags(tags: string[]): string[] | undefined {
  if (tags.length === 0) return undefined
  return Array.from(new Set(tags.map(normalizeTag))).filter(Boolean).sort();
}

function normalizeParam(
  value: string | string[] | undefined | null
): string | undefined {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : undefined;
}

// Main function: normalize search params into the shape you want
export function getNormalizedSearchParams(
  searchParams: RawSearchParams | URLSearchParams,
): NormalizedSearchParams {
  const getRaw = (key: string): string | string[] | undefined => {
    const params = searchParams;
    if (params instanceof URLSearchParams) {
      const all = params.getAll(key);
      if (all.length === 0) return undefined;
      return all.length === 1 ? all[0] : all;
    }

    return params[key];
  };

  // Prefer the new comma-separated `tags` param, but gracefully fall back to legacy `tag` keys.
  const rawTagsParam = getRaw('tags');
  const rawLegacyTags = asStringArray(getRaw('tag'));

  const parsedTagsFromTagsParam: string[] = [];

  if (typeof rawTagsParam === 'string') {
    parsedTagsFromTagsParam.push(
      ...rawTagsParam
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    );
  } else if (Array.isArray(rawTagsParam)) {
    parsedTagsFromTagsParam.push(...rawTagsParam);
  }

  const combinedTags = [...parsedTagsFromTagsParam, ...rawLegacyTags];

  const normalized = {
    search: normalizeParam(getRaw('search')),
    category: normalizeParam(getRaw('category')),
    sort: normalizeParam(getRaw('sort')),
    tags: normalizeTags(combinedTags),
    exclusive: normalizeParam(getRaw('exclusive')),
    after: normalizeParam(getRaw('after')),
  };

  return normalized;
}