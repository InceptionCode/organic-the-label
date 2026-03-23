'use server';

import { ResetPasswordSchema, type ResetPassword } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { parseWithZod } from "@conform-to/zod/v4";
import { parseSubmission } from "@conform-to/react/future";
import { cookies } from "next/headers";
import { RECOVERY_COOKIE_MAX_AGE, RECOVERY_COOKIE_NAME } from "@/lib/constants";
import { generateToken } from "@/utils/helpers/token";

export type ResetPasswordActionState = { ok: true; error: null };

export const resetPasswordRequest = async (
  _: unknown,
  formData: FormData
) => {
  const submission = parseWithZod(formData, { schema: ResetPasswordSchema });
  const { payload } = parseSubmission(formData);

  const cookieStore = await cookies();

  if (submission.status === 'error') {
    console.error('Invalid reset password form submission', submission.error?.issues);
    return submission.reply();
  }

  const supabase = await createSupabaseAdminClient();
  const { email, captchaToken } = payload as ResetPassword;

  try {
    const recoveryToken = generateToken();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login/reset-password?${RECOVERY_COOKIE_NAME}=${recoveryToken}`,
    });

    if (error) {
      console.error('Supabase resetPasswordForEmail failed', error);
      return submission.reply({ formErrors: [error.message] });
    }

    // Set cookie with recovery value
    cookieStore.set(RECOVERY_COOKIE_NAME, recoveryToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: RECOVERY_COOKIE_MAX_AGE,
      path: '/',
    });

    return { ok: true, error: null };
  } catch (e) {
    console.error('Unexpected reset password error', e);
    return submission.reply({ formErrors: ['Something went wrong. Please try again.'] });
  }
}