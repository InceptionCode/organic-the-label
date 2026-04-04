'use client';

import { useActionState, useState } from 'react';
import HCaptchaField from '@/app/components/auth/hcaptcha-field';
import { magicLinkAction } from '@/app/api/auth/magic-link-action';
import { Button, TextField } from '@/ui-components';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { MagicLinkSchema } from '@/lib/schemas';

export default function MagicLinkPage({ linkText }: { linkText?: string }) {
  const [state, action, pending] = useActionState(magicLinkAction, undefined);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const lastResult = state && typeof state === 'object' && !('ok' in state) ? state : null;

  const [magicForm, magicFields] = useForm({
    id: 'magic-link',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: MagicLinkSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = magicForm.valid === false;

  return (
    <main>
      <form
        id={magicForm.id}
        action={action}
        onSubmit={magicForm.onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {magicForm.errors ? (
          <div
            className="text-body-s px-3 py-2 rounded-md"
            style={{ background: 'rgba(224,61,42,0.10)', color: 'var(--danger)' }}
            role="alert"
          >
            {Array.isArray(magicForm.errors) ? magicForm.errors.join(', ') : String(magicForm.errors)}
          </div>
        ) : null}
        <TextField
          name={magicFields.email.name}
          type="email"
          label="Email"
          labelClassName="dark:text-black"
          className="bg-white text-black placeholder:text-black"
          defaultValue={
            typeof magicFields.email.initialValue === 'string' ? magicFields.email.initialValue : undefined
          }
        />
        {magicFields.email.errors ? (
          <p className="text-body-s" style={{ color: 'var(--danger)' }}>
            {Array.isArray(magicFields.email.errors)
              ? magicFields.email.errors.join(', ')
              : String(magicFields.email.errors)}
          </p>
        ) : null}

        <input type="hidden" name={magicFields.captchaToken.name} value={captchaToken ?? ''} />

        <HCaptchaField onTokenChange={setCaptchaToken} />

        {magicFields.captchaToken.errors ? (
          <p className="text-body-s" style={{ color: 'var(--danger)' }}>
            {Array.isArray(magicFields.captchaToken.errors)
              ? magicFields.captchaToken.errors.join(', ')
              : String(magicFields.captchaToken.errors)}
          </p>
        ) : null}

        {state && typeof state === 'object' && 'ok' in state && state.ok === true ? (
          <p className="text-body-s text-black">Check your email for the magic link.</p>
        ) : null}

        <Button type="submit" disabled={disabled || pending || !captchaToken}>
          {linkText || 'Send Magic Link'}
        </Button>
      </form>
    </main>
  );
}