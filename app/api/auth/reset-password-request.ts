'use client'

import { SigninFormSchema, type SigninForm } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"
import { parseWithZod } from "@conform-to/zod/v4";
import { parseSubmission } from "@conform-to/react/future";
import { AuthError } from "@supabase/supabase-js"

export type ResetPasswordRequest = {
  error?: AuthError | unknown | null;
} | void

export const resetPasswordRequest = async (_: unknown, formData: FormData): Promise<ResetPasswordRequest> => {
  const supabase = createSupabaseBrowserClient()

  const { status, reply } = parseWithZod(formData, { schema: SigninFormSchema.pick({ email: true }) })
  const { payload } = parseSubmission(formData)

  if (status === 'error') {
    console.error('Submission failed: replying...')

    return {
      error: { message: 'Form submission error', error: reply() }
    }
  }

  const { email } = payload as SigninForm


  if (!email) {
    const error = Error('Must provide a valid email')

    console.log(error)
    return { error }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error(error)
    return { error }
  }
}