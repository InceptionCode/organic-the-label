'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-md rounded-xl p-8 space-y-6"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="space-y-1">
          <p className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>
            Password recovery
          </p>
          <h1
            className="text-primary"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            SET NEW PASSWORD
          </h1>
        </div>

        <form
          id={form.id}
          action={action}
          onSubmit={form.onSubmit}
          noValidate
          className="flex flex-col gap-2.5"
        >
          {form.errors ? (
            <div
              className="text-body-s px-3 py-2 rounded-md"
              style={{ background: 'rgba(224,61,42,0.10)', color: 'var(--danger)' }}
              role="alert"
            >
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
          {fields.password.errors ? (
            <p className="text-body-s" style={{ color: 'var(--danger)' }}>
              {Array.isArray(fields.password.errors)
                ? fields.password.errors.join(', ')
                : String(fields.password.errors)}
            </p>
          ) : null}
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
          {fields.confirmPassword.errors ? (
            <p className="text-body-s" style={{ color: 'var(--danger)' }}>
              {Array.isArray(fields.confirmPassword.errors)
                ? fields.confirmPassword.errors.join(', ')
                : String(fields.confirmPassword.errors)}
            </p>
          ) : null}

          <div className="flex flex-col items-center gap-4 pt-2">
            <Button type="submit" disabled={disabled} className="w-full mt-2">
              Reset password
            </Button>
          </div>
        </form>

        <p className="text-center text-body-s text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
