import { createStore } from 'zustand/vanilla'

export type AuthStoreState = {
    user?: {
        username: string;
        isAnon: boolean;
        preferences?: object;
    } | null
}

export type AuthStore = AuthStoreState; // may change when I need auth actions.

export const createAuthStore = (
    initState: AuthStoreState = { user: null }
) => {
    return createStore<AuthStore>()(() => ({ ...initState }))
}