import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  username: string
  email: string
  created_at: string
  confirmed_at: string
  is_anon: boolean
  id?: string
  updated_at?: string
  last_signed_in?: string
  avatar_url?: string
  is_member: boolean
}

export const mapSupabaseUser = (u?: SupabaseUser | null): User | null => {
  if (!u) return null

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
  }
}
