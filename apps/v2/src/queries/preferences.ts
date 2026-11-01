import { queryOptions } from '@tanstack/react-query'
import { getPreferencesFn } from '~/fns/preferences.fn'
import { ACCOUNT_KEY } from './account'

// Under ['account'] so sign-out and a user change drop it with the rest of the account queries.
// The save mutation lives with the form (components/account/preferences-form.tsx): the /account
// loader imports this module, and loaders ship in the entry chunk.
export const preferencesQueries = {
  current: () => queryOptions({ queryKey: [...ACCOUNT_KEY, 'preferences'], queryFn: () => getPreferencesFn() }),
}
