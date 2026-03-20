'use client';

import { useActionState, useState } from 'react';
import HCaptchaField from '@/app/components/auth/hcaptcha-field';
import { resetPasswordRequest } from '@/app/api/auth/reset-password-request';
import { TextField, Button } from '@/ui-components';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { ResetPasswordSchema } from '@/lib/schemas';

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPasswordRequest, undefined);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const lastResult = state && typeof state === 'object' && !('ok' in state) ? state : null;

  const [resetForm, resetFields] = useForm({
    id: 'reset-password',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ResetPasswordSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = resetForm.valid === false;

  return (
    <main>
      <form
        id={resetForm.id}
        action={action}
        onSubmit={resetForm.onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {resetForm.errors ? (
          <div className="text-destructive text-sm" role="alert">
            {Array.isArray(resetForm.errors) ? resetForm.errors.join(', ') : String(resetForm.errors)}
          </div>
        ) : null}
        <TextField
          name={resetFields.email.name}
          type="email"
          label="Email"
          defaultValue={
            typeof resetFields.email.initialValue === 'string' ? resetFields.email.initialValue : undefined
          }
        />
        <p>
          {resetFields.email.errors
            ? Array.isArray(resetFields.email.errors)
              ? resetFields.email.errors.join(', ')
              : String(resetFields.email.errors)
            : null}
        </p>

        <input type="hidden" name={resetFields.captchaToken.name} value={captchaToken ?? ''} />
        <HCaptchaField onTokenChange={setCaptchaToken} />

        <p>
          {resetFields.captchaToken.errors
            ? Array.isArray(resetFields.captchaToken.errors)
              ? resetFields.captchaToken.errors.join(', ')
              : String(resetFields.captchaToken.errors)
            : null}
        </p>

        {state && typeof state === 'object' && 'ok' in state && state.ok === true ? (
          <p>Check your email for reset instructions.</p>
        ) : null}

        <Button type="submit" disabled={disabled || pending || !captchaToken}>
          Send Reset Link
        </Button>
      </form>
    </main>
  );
}