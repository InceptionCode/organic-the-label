import { ResetPasswordSchema, type ResetPassword } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/utils/supabase/server-base"
import { parseWithZod } from "@conform-to/zod/v4";
import { parseSubmission } from "@conform-to/react/future";

export type ResetPasswordActionState = { ok: true; error: null };

export const resetPasswordRequest = async (
  _: unknown,
  formData: FormData
) => {
  const submission = parseWithZod(formData, { schema: ResetPasswordSchema });
  const { payload } = parseSubmission(formData);

  if (submission.status === 'error') {
    console.error('Invalid reset password form submission', submission.error?.issues);
    return submission.reply();
  }

  const supabase = await createSupabaseServerClient();
  const { email, captchaToken } = payload as ResetPassword;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
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