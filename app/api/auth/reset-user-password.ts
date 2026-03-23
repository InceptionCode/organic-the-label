'use server'

import {
  ResetPasswordConfirmSchema,
  type ResetPasswordConfirm,
} from '@/lib/schemas'
import { createSupabaseServerClient } from '@/utils/supabase/server-base'
import { parseWithZod } from '@conform-to/zod/v4'
import { parseSubmission } from '@conform-to/react/future'
import { RECOVERY_COOKIE_NAME } from '@/lib/constants'
import { cookies } from 'next/headers'

export type ResetUserPasswordActionState = {
  ok: true
  error: null
}

export async function resetUserPasswordAction(
  _: unknown,
  formData: FormData
): Promise<ResetUserPasswordActionState | object> {
  const supabase = await createSupabaseServerClient()
  const cookieStore = await cookies()

  try {
    const submission = parseWithZod(formData, { schema: ResetPasswordConfirmSchema })
    const { payload } = parseSubmission(formData)

    if (submission.status === 'error') {
      console.error(
        'resetUserPasswordAction: invalid form submission',
        submission.error?.issues ?? submission
      )
      return submission.reply()
    }

    const { password } = payload as ResetPasswordConfirm

    console.info('resetUserPasswordAction: parsed reset password form')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('resetUserPasswordAction: Supabase updateUser failed', error)
      return submission.reply({ formErrors: [error.message] })
    }

    cookieStore.delete(RECOVERY_COOKIE_NAME)
    console.info('resetUserPasswordAction: recovery token cookie deleted')

    return {
      ok: true,
      error: null,
    }
  } catch (e) {
    console.error('resetUserPasswordAction: unexpected error', e)
    const submission = parseWithZod(formData, { schema: ResetPasswordConfirmSchema })
    return submission.reply({
      formErrors: ['Something went wrong. Please try again.'],
    })
  }
}
