import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

// Flat, v1-shaped search params (pages/README.md): `tags=trap,melodic`, `exclusive=true`, never
// JSON-quoted. Values parse as plain strings (qss turns "true" and numbers into primitives and
// repeated keys into arrays); each route's validateSearch normalizes them. Arrays serialize as
// comma lists.
export const parseSearch = parseSearchWith((value) => value)
export const stringifySearch = stringifySearchWith((value: unknown) =>
  Array.isArray(value) ? value.join(',') : String(value),
)
