
export type NormalizedSearchParams = {
  search?: string;
  category?: string;
  sort?: string;
  exclusive?: string;
};

export type ResolvedProductSearchParams = {
  search?: string | null;
  category?: string | null;
  sort?: string | null;
  exclusive?: string | null;
}

export type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};


function normalizeParam(
  value: string | string[] | undefined | null
): string | undefined {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

// Main function: normalize search params into the shape you want
export function getNormalizedSearchParams(
  searchParams: RawSearchParams | URLSearchParams
): NormalizedSearchParams {
  const getRaw = (key: string): string | string[] | undefined => {
    const params = searchParams
    if (params instanceof URLSearchParams) {
      const all = params.getAll(key);
      if (all.length === 0) return undefined;
      return all.length === 1 ? all[0] : all;
    }

    return params[key];
  };

  const normalized = {
    search: normalizeParam(getRaw("search")),
    category: normalizeParam(getRaw("category")),
    sort: normalizeParam(getRaw("sort")),
    exclusive: normalizeParam(getRaw("exclusive")),
  };

  return normalized;
}