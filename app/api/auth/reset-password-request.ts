'use server';

import { ResetPasswordSchema, type ResetPassword } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { parseWithZod } from "@conform-to/zod/v4";
import { parseSubmission } from "@conform-to/react/future";

export type ResetPasswordActionState = { ok: true; error: null };

export async function resetPasswordRequest(
  _: unknown,
  formData: FormData
): Promise<ResetPasswordActionState | object> {
  const submission = parseWithZod(formData, { schema: ResetPasswordSchema });
  const { payload } = parseSubmission(formData);

  if (submission.status === 'error') {
    console.error('Invalid reset password form submission', submission.error?.issues);
    return submission.reply();
  }

  const supabase = createSupabaseAdminClient();
  const { email, captchaToken } = payload as ResetPassword;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login/reset-password`,
    });

    if (error) {
      console.error('Supabase resetPasswordForEmail failed', error);
      return submission.reply({ formErrors: [error.message] });
    }

    return { ok: true, error: null };
  } catch (e) {
    console.error('Unexpected reset password error', e);
    return submission.reply({ formErrors: ['Something went wrong. Please try again.'] });
  }
}