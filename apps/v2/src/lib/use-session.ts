import { useSuspenseQuery } from '@tanstack/react-query'
import { sessionQueryOptions } from '~/queries/session'

export function useSession() {
  return useSuspenseQuery(sessionQueryOptions()).data
}
