import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/lib/schemas';

// Canonical Supabase user -> app User mapping. Shared by the browser auth
// context, the getUser server action, and proxy.ts middleware so all three
// agree on what a "user" looks like.
export const mapSupabaseUser = (u?: SupabaseUser | null): User | null => {
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
