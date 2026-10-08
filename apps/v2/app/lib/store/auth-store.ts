import { createStore } from 'zustand/vanilla'
import type { User } from '~/lib/supabase/map-user'

export type AuthStoreState = {
  user?: User | null
}

export type AuthStore = AuthStoreState

export const defaultUserState: User = {
  username: '',
  created_at: '',
  confirmed_at: '',
  is_anon: true,
  is_member: false,
  email: '',
}

export const createAuthStore = (initState: AuthStoreState = { user: null }) =>
  createStore<AuthStore>()(() => ({ ...initState }))
