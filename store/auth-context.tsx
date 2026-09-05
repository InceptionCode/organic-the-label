'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { createSupabaseBrowserClient } from '@/utils/supabase/client-base';
import type { User } from '@/lib/schemas';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthStore } from '@/lib/store';
import { createAuthStore } from '@/lib/store';
import { mapSupabaseUser } from '@/lib/supabase/map-user';

type AuthStoreApi = ReturnType<typeof createAuthStore>;

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export { mapSupabaseUser };

export type AuthStateChangeDecision =
  | { type: 'skip' }
  | { type: 'update'; user: User | null };

// Pure decision logic for onAuthStateChange, split out from the effect below
// so it's testable without a real Supabase client or a rendered component.
//
// The server already seeds the store with a cookie-verified user for this
// render (see InitAuthStore).

export function resolveAuthStateChange(
  event: string,
  session: { user?: SupabaseUser | null } | null,
  isFirstEvent: boolean
): AuthStateChangeDecision {
  if (isFirstEvent && event === 'INITIAL_SESSION') {
    return { type: 'skip' };
  }

  return { type: 'update', user: mapSupabaseUser(session?.user ?? null) };
}

export function AuthStoreProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [store] = useState(() => createAuthStore({ user: initialUser }));
  const isFirstEvent = useRef(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const decision = resolveAuthStateChange(event, session, isFirstEvent.current);
      isFirstEvent.current = false;

      if (decision.type === 'skip') return;

      store.setState((state) => ({
        ...state,
        user: decision.user,
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

