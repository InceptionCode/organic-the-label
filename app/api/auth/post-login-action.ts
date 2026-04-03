'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server-base';
import { bootstrapAuthenticatedUser } from '@/lib/supabase/boostrap-authenticate-user';

export async function postLoginBootstrapAction(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) return;

    await bootstrapAuthenticatedUser({
      userId: user.id,
      email: user.email,
      emailVerified: !!(user.email_confirmed_at ?? user.confirmed_at),
      displayName:
        (user.user_metadata?.username as string | undefined) ??
        (user.user_metadata?.display_name as string | undefined) ??
        null,
    });
  } catch (e) {
    console.error('postLoginBootstrapAction failed', e);
  }
}
