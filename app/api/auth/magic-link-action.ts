'use server';

import { MagicLinkSchema, type MagicLink } from '@/lib/schemas';
import { createSupabasePublicClient } from '@/utils/supabase/base';
import { parseWithZod } from '@conform-to/zod/v4';
import { parseSubmission } from '@conform-to/react/future';

export type MagicLinkActionState = { ok: true; error: null };

export async function magicLinkAction(_prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, { schema: MagicLinkSchema });
  const { payload } = parseSubmission(formData);

  if (submission.status === 'error') {
    console.error('Invalid magic link form submission', submission.error?.issues);
    return submission.reply();
  }

  const supabase = createSupabasePublicClient();
  const { email, captchaToken } = payload as MagicLink;

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        captchaToken,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm?next=/explore`,
      },
    });

    if (error) {
      console.error('Supabase magic link signInWithOtp failed', error);
      return submission.reply({ formErrors: [error.message] });
    }

    return { ok: true, error: null };
  } catch (e) {
    console.error('Unexpected magic link error', e);
    return submission.reply({ formErrors: ['Something went wrong. Please try again.'] });
  }
}