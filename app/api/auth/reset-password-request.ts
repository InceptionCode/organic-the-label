'use client'

import { SigninFormSchema, type SigninForm } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/utils/supabase/client-base"
import { parseWithZod } from "@conform-to/zod/v4";
import { parseSubmission } from "@conform-to/react/future";

export const resetPasswordRequest = async (
  _: unknown,
  formData: FormData
): Promise<object | undefined> => {
  const supabase = createSupabaseBrowserClient()
  const submission = parseWithZod(formData, { schema: SigninFormSchema.pick({ email: true }) })
  const { payload } = parseSubmission(formData)

  if (submission.status === 'error') {
    console.error('Submission failed: replying...')
    return submission.reply()
  }

  const { email } = payload as SigninForm

  if (!email) {
    console.error('Error:Must provide a valid email')
    return submission.reply({ formErrors: ['Must provide a valid email'] })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error(error)
    return submission.reply({ formErrors: [error.message] })
  }
}