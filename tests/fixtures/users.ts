import type { User } from '@/lib/schemas'
import { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * User fixtures for unit and integration tests.
 * Shapes match lib/schemas.ts UserSchema exactly.
 */

export const anonUser: User = {
  username: '',
  email: '',
  is_anon: true,
  is_member: false,
  created_at: '2024-01-01T00:00:00.000Z',
  confirmed_at: '',
  id: 'anon-user-id',
}

export const signedInUser: User = {
  username: 'testuser',
  email: 'test@example.com',
  is_anon: false,
  is_member: false,
  created_at: '2024-01-01T00:00:00.000Z',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  id: 'user-abc-123',
  avatar_url: undefined,
}

export const memberUser: User = {
  ...signedInUser,
  id: 'member-abc-456',
  is_member: true,
}

export const supabaseAnonUser: SupabaseUser = {
  id: 'anon-user-id',
  app_metadata: {
    provider: 'email',
    provider_id: 'anon-user-id',
  },
  user_metadata: {
    username: 'ANON BOT',
    avatar_url: 'https://example.com/avatar.png',
    is_member: false,
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  is_anonymous: true,
}

export const supabaseSignedInUser: SupabaseUser = {
  id: 'user-abc-123',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email',
    provider_id: 'user-abc-123',
  },
  user_metadata: {
    username: 'testuser',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.png',
    is_member: false,
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  is_anonymous: false,
}