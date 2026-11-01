import { queryOptions } from '@tanstack/react-query'
import { getSessionFn } from '~/fns/session.fn'

export const SESSION_KEY = ['session'] as const

// Loaded once per document; AuthSync and the auth fns update it in place.
export const sessionQueryOptions = () =>
  queryOptions({ queryKey: SESSION_KEY, queryFn: () => getSessionFn(), staleTime: Infinity, gcTime: Infinity })
