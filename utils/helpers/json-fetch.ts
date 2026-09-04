export type JsonFetchBodyError = {
  ok?: boolean;
  error?: string;
  errors?: { message?: string }[];
};

export type JsonFetchOptions = {
  failOnOkFalse?: boolean;
  defaultErrorMessage?: string;
};

function messageFromBody(
  data: JsonFetchBodyError | null | undefined,
  fallback: string,
): string {
  if (!data) return fallback;
  const fromErrors = Array.isArray(data.errors)
    ? data.errors
      .map((e) => e?.message)
      .filter((m): m is string => Boolean(m))
      .join(', ')
    : '';
  return data.error || fromErrors || fallback;
}

/**
 * `fetch` + `res.json()` with typed result and consistent error messages from common API shapes.
 */
export async function jsonFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: JsonFetchOptions,
): Promise<T> {
  const { failOnOkFalse = false, defaultErrorMessage = 'Request failed' } =
    options ?? {};

  const res = await fetch(input, init);
  const data = (await res.json()) as T & JsonFetchBodyError;

  const httpFailed = !res.ok;
  const bodyFailed = failOnOkFalse && data?.ok === false;

  if (httpFailed || bodyFailed) {
    throw new Error(messageFromBody(data, defaultErrorMessage));
  }

  return data as T;
}
