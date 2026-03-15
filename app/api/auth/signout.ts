'use client';

import { createSupabaseBrowserClient } from '@/utils/supabase/client-base';

export async function signOutAction(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out failed', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
