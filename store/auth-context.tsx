'use client';

import { useRef, useContext, createContext, useEffect } from 'react';
import { useStore } from 'zustand';
import { type AuthStore, createAuthStore } from '@/lib/store';
import isEmpty from 'lodash/isEmpty';
import { createSupabaseBrowserClient } from '@/lib/supabase/client-base';

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export const AuthStoreProvider = ({ children }: React.PropsWithChildren) => {
  const supabase = createSupabaseBrowserClient();

  const storeRef = useRef<AuthStoreApi | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'INITIAL_SESSION':
          storeRef.current?.setState((state) => ({
            ...state,
            user: {
              username: session?.user.user_metadata.username || session?.user.email,
              isAnon: session?.user.is_anonymous ?? true,
            },
          }));

          break;
        case 'SIGNED_OUT':
          storeRef.current?.setState((state) => ({
            ...state,
            user: { username: '', isAnon: true },
          }));

          break;
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          storeRef.current?.setState((state) => ({
            ...state,
            user: {
              username: session?.user.user_metadata.username || session?.user.email,
              isAnon: session?.user.is_anonymous ?? false,
            },
          }));

          break;
        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isEmpty(storeRef.current)) {
    storeRef.current = createAuthStore({ user: null });
  }

  return <AuthStoreContext.Provider value={storeRef.current}>{children}</AuthStoreContext.Provider>;
};

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext);

  if (!authStoreContext) {
    throw new Error(`useAuthStore must be used within AuthStoreContext`);
  }

  return useStore(authStoreContext, selector);
};
