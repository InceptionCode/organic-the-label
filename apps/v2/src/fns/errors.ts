export function toSafeError(scope: string, publicMessage: string, error: unknown): Error {
  console.error(`[${scope}]`, error instanceof Error ? error.message : error)
  return new Error(publicMessage)
}
