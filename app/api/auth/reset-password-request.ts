'use client'

import { SigninFormSchema } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"
import { AuthError } from "@supabase/supabase-js"
import { parseForm } from "react-zorm";

export type ResetPasswordRequest = {
  error?: AuthError | unknown | null;
} | void

export const resetPasswordRequest = async (_: unknown, formData: FormData): Promise<ResetPasswordRequest> => {
  const supabase = createSupabaseBrowserClient()

  const { email } = parseForm(SigninFormSchema.pick({ email: true }), formData)


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