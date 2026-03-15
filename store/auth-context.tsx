'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/utils/supabase/client-base';

import type { User } from '@/lib/schemas';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AuthContextValue = { user: User | null };

const AuthContext = createContext<AuthContextValue | null>(null);

let authInitRequested = false;

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
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    if (!authInitRequested) {
      authInitRequested = true;
      fetch('/api/auth/init', { method: 'POST', credentials: 'include' }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useUser must be used within AuthStoreProvider');
  }

  return ctx.user;
}
