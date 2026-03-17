'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { createSupabaseBrowserClient } from '@/utils/supabase/client-base';
import type { User } from '@/lib/schemas';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthStore } from '@/lib/store';
import { createAuthStore } from '@/lib/store';

type AuthStoreApi = ReturnType<typeof createAuthStore>;

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

const mapSupabaseUser = (u?: SupabaseUser | null): User | null => {
  if (!u) return null;

  return {
    username: u.user_metadata?.username ?? u.email ?? '',
    is_anon: u.is_anonymous ?? false,
    email: u.email ?? '',
    created_at: u.created_at ?? '',
    confirmed_at: u.confirmed_at ?? '',
    updated_at: u.updated_at,
    last_signed_in: u.last_sign_in_at,
    avatar_url: u.user_metadata?.avatar_url,
    is_member: u.user_metadata?.is_member ?? false,
  };
};

export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [store] = useState(() => createAuthStore({ user: null }));

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = mapSupabaseUser(session?.user ?? null);
      store.setState((state) => ({
        ...state,
        user: nextUser,
      }));
    });

    return () => subscription.unsubscribe();
  }, [supabase, store]);

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext);

  if (!authStoreContext) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }

  return useStore(authStoreContext, selector);
};

export function useUser() {
  return useAuthStore((state) => state.user ?? null);
}

