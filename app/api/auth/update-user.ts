'use client'

import { UpdateUserFormSchema } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"
import { AuthError } from "@supabase/supabase-js"
import { parseForm } from "react-zorm";

export type UpdateUserActionState = {
  ok: boolean,
  error: {
    message: string;
    error: AuthError | unknown | null;
  } | null
}

export const updateUserAction = async (_: unknown, formData: FormData): Promise<UpdateUserActionState> => {
  const supabase = createSupabaseBrowserClient()
  console.info('instantiated supabase client')
  const { username, avatar_url, ...form } = parseForm(UpdateUserFormSchema, formData)

  console.info('parsed user form data')

  const updates = {
    ...form,
    confirmPassword: null,
    data: { username, avatar_url }
  }

  const { error } = await supabase.auth.updateUser(updates)

  if (error) {
    console.error(error)
    return {
      ok: false,
      error: {
        message: 'Error updating user info!',
        error
      }
    }
  }

  return {
    ok: true,
    error: null
  }
}