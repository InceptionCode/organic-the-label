'use client'

import {
  type UpdateUserForm,
  UpdateUserFormSchema,
} from '@/lib/schemas'
import { createSupabaseBrowserClient } from '@/utils/supabase/client-base'
import { parseWithZod } from '@conform-to/zod/v4'
import { parseSubmission } from '@conform-to/react/future'

export type UpdateUserActionState = {
  ok: true
  error: null
}

export const updateUserAction = async (
  _: unknown,
  formData: FormData
): Promise<UpdateUserActionState | object> => {
  const supabase = createSupabaseBrowserClient()

  console.info('updateUserAction: instantiated supabase client')

  try {
    const submission = parseWithZod(formData, { schema: UpdateUserFormSchema })
    const { payload } = parseSubmission(formData)

    if (submission.status === 'error') {
      console.error(
        'updateUserAction: invalid form submission',
        submission.error?.issues ?? submission
      )
      return submission.reply()
    }

    const { username, avatar_url, ...form } = payload as UpdateUserForm

    const updates = {
      ...form,
      confirmPassword: null,
      data: { username, avatar_url }
    }

    console.info('updateUserAction: parsed update user form')

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      console.error('updateUserAction: Supabase updateUser failed', error)
      return submission.reply({ formErrors: [error.message] })
    }

    return {
      ok: true,
      error: null,
    }
  } catch (e) {
    console.error('updateUserAction: unexpected error', e)
    const submission = parseWithZod(formData, { schema: UpdateUserFormSchema })
    return submission.reply({
      formErrors: ['Something went wrong. Please try again.'],
    })
  }
}
