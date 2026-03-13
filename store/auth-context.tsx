'use client';

import dayjs from 'dayjs';
import { useContext, createContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { type AuthStore, createAuthStore } from '@/lib/store';
import { createSupabaseBrowserClient } from '@/lib/supabase/client-base';
import { User } from '@supabase/supabase-js';
import { defaultUserState } from '@/lib/store/auth-store';

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export type AuthProviderProps = React.PropsWithChildren<{ initialUser?: AuthStore['user'] }>;
export const AuthStoreProvider = ({ initialUser, children }: AuthProviderProps) => {
  const supabase = createSupabaseBrowserClient();
  const [store] = useState(() => createAuthStore({ user: initialUser }));

  const setUpdatedUser = (user?: User) => ({
    username: user?.user_metadata.username || user?.email,
    is_anon: user?.is_anonymous ?? false,
    created_at: user?.created_at ?? '',
    confirmed_at: user?.confirmed_at ?? '',
    updated_at: user?.updated_at,
    last_signed_in: user?.last_sign_in_at,
    avatar_url: user?.user_metadata.avatar_url,
    is_member: user?.user_metadata.is_member,
  });

  useEffect(() => {
    fetch("/api/auth/init", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Silent fail for MVP
    });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          const currentSignInAt = store.getState().user?.last_signed_in;
          const isNewSignin = !dayjs(currentSignInAt).isSame(dayjs(session?.user.last_sign_in_at));

          if (isNewSignin) {
            // update user
            store.setState((state) => ({
              ...state,
              user: setUpdatedUser(session?.user),
            }));
          }
          break;
        case 'SIGNED_OUT':
          store.setState((state) => ({
            ...state,
            user: defaultUserState,
          }));

          break;
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          store.setState((state) => ({
            ...state,
            user: setUpdatedUser(session?.user),
          }));

          break;
        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, store]);

  return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>;
};

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext);

  if (!authStoreContext) {
    throw new Error(`useAuthStore must be used within AuthStoreContext`);
  }

  return useStore(authStoreContext, selector);
};
