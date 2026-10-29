import { queryOptions } from '@tanstack/react-query'
import { getAccountSummaryFn, getOwnedProductsFn, getOwnedResourcesFn } from '~/fns/account.fn'

/** Every account query sits under this prefix so sign-out can drop them in one call. */
export const ACCOUNT_KEY = ['account'] as const

export const accountQueries = {
  summary: () => queryOptions({ queryKey: [...ACCOUNT_KEY, 'summary'], queryFn: () => getAccountSummaryFn() }),
  ownedProducts: () =>
    queryOptions({ queryKey: [...ACCOUNT_KEY, 'owned-products'], queryFn: () => getOwnedProductsFn() }),
  ownedResources: () =>
    queryOptions({ queryKey: [...ACCOUNT_KEY, 'owned-resources'], queryFn: () => getOwnedResourcesFn() }),
}
