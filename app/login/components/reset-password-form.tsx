'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { ResetPasswordConfirmSchema } from '@/lib/schemas'
import { resetUserPasswordAction } from '@/app/api/auth/reset-user-password'
import { TextField, Button } from '@/ui-components'

export default function ResetPasswordForm() {
  const router = useRouter()

  const [state, action, pending] = useActionState(resetUserPasswordAction, undefined)
  const lastResult =
    state && typeof state === 'object' && !('ok' in state) ? state : null

  const [form, fields] = useForm({
    id: 'login-reset-password',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ResetPasswordConfirmSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  const disabled = form.valid === false || pending

  useEffect(() => {
    if (
      state &&
      typeof state === 'object' &&
      'ok' in state &&
      state.ok === true
    ) {
      router.replace('/login')
    }
  }, [router, state])

  return (
    <main>
      <form
        id={form.id}
        action={action}
        onSubmit={form.onSubmit}
        noValidate
        className="flex flex-col gap-2.5"
      >
        {form.errors ? (
          <div className="text-danger text-sm" role="alert">
            {Array.isArray(form.errors)
              ? form.errors.join(', ')
              : String(form.errors)}
          </div>
        ) : null}
        <TextField
          name={fields.password.name}
          label="Password"
          type="password"
          defaultValue={
            typeof fields.password.initialValue === 'string'
              ? fields.password.initialValue
              : undefined
          }
        />
        <p className="text-danger text-sm">
          {fields.password.errors
            ? Array.isArray(fields.password.errors)
              ? fields.password.errors.join(', ')
              : String(fields.password.errors)
            : null}
        </p>
        <TextField
          name={fields.confirmPassword.name}
          label="Confirm Password"
          type="password"
          defaultValue={
            typeof fields.confirmPassword.initialValue === 'string'
              ? fields.confirmPassword.initialValue
              : undefined
          }
        />
        <p className="text-danger text-sm">
          {fields.confirmPassword.errors
            ? Array.isArray(fields.confirmPassword.errors)
              ? fields.confirmPassword.errors.join(', ')
              : String(fields.confirmPassword.errors)
            : null}
        </p>

        <div className="flex flex-col items-center gap-4 pt-2">
          <Button type="submit" disabled={disabled} className="gap-y-4 sm:w-[20%]">
            Reset password
          </Button>
        </div>
      </form>
    </main>
  )
}
