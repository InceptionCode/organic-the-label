export function parseMultiValueParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function serializeMultiValueParam(values: string[]): string | null {
  if (!values || values.length === 0) return null;

  return values.join(',');
}

