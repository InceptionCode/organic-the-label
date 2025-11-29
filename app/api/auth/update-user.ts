'use client'

import { UpdateUserForm, UpdateUserFormSchema } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"
import { AuthError } from "@supabase/supabase-js"
import { parseWithZod } from '@conform-to/zod/v4';
import { parseSubmission } from '@conform-to/react/future';

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

  const { status, reply } = parseWithZod(formData, { schema: UpdateUserFormSchema })
  const { payload } = parseSubmission(formData)

  if (status === 'error') {
    console.error('Submission failed: replying...')

    return {
      ok: false,
      error: { message: 'Form submission error', error: reply() }
    }
  }

  const { username, avatar_url, ...form } = payload as UpdateUserForm

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