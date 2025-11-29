import { User } from '@/lib/schemas';
import { createStore } from 'zustand/vanilla'

export type AuthStoreState = {
    user?: User | null
    resetPassword?: boolean
}

export type AuthStore = AuthStoreState; // may change when I need auth actions.

export const defaultUserState: User = {
    username: '',
    created_at: '',
    confirmed_at: '',
    isAnon: true
}

export const createAuthStore = (
    initState: AuthStoreState = { user: null }
) => {
    return createStore<AuthStore>()(() => ({
        ...initState
    }))
}