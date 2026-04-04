'use client';

import { useActionState, useEffect, useState } from 'react';
import { signinAction } from '@/app/api/auth/auth-actions';
import { SigninFormSchema } from '@/lib/schemas';
import {
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui-components';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { redirect } from 'next/navigation';
import MagicLink from '@/app/components/auth/magic-link';
import ResetPassword from '@/app/components/auth/reset-password';

// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state.
// Later version will include the option to sign in via the Google provider.
export default function Login() {
  const [signinState, signinSubmitAction, signinPending] = useActionState(signinAction, undefined);
  const lastResult = signinState && typeof signinState === 'object' && !('ok' in signinState) ? signinState : null;

  const [loginForm, loginFields] = useForm({
    id: 'login',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SigninFormSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = loginForm.valid === false;

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openMagicLinkDialog, setOpenMagicLinkDialog] = useState<boolean>(false);

  useEffect(() => {
    if (signinState && typeof signinState === 'object' && 'ok' in signinState && signinState.ok) {
      trackActivity({
        eventType: 'user_signed_in',
        eventProperties: {
          email: loginFields.email.value,
          date: new Date().toISOString(),
          source: "login_page" // for analytics purposes later - track the trigger of the login event
        },
      });
      fetch('/api/auth/bootstrap', { method: 'POST', credentials: 'include' })
        .then((res) => res.json())
        .then((data) => { if (data.ok) redirect('/explore'); });
    }
  }, [loginFields.email.value, signinState]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-md rounded-xl p-8 space-y-6"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="space-y-1">
          <p className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>Welcome back</p>
          <h1
            className="text-primary"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', letterSpacing: '0.02em', lineHeight: 1 }}
          >
            SIGN IN
          </h1>
        </div>

        <form
          id={loginForm.id}
          action={signinSubmitAction}
          onSubmit={loginForm.onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {loginForm.errors ? (
            <div className="text-body-s px-3 py-2 rounded-md" style={{ background: 'rgba(224,61,42,0.10)', color: 'var(--danger)' }} role="alert">
              {Array.isArray(loginForm.errors) ? loginForm.errors.join(', ') : String(loginForm.errors)}
            </div>
          ) : null}

          <div className="space-y-1">
            <TextField
              name={loginFields.email.name}
              label="Email"
              type="email"
              defaultValue={typeof loginFields.email.initialValue === 'string' ? loginFields.email.initialValue : undefined}
            />
            {loginFields.email.errors && (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(loginFields.email.errors) ? loginFields.email.errors.join(', ') : String(loginFields.email.errors)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <TextField
              name={loginFields.password.name}
              label="Password"
              type="password"
              defaultValue={typeof loginFields.password.initialValue === 'string' ? loginFields.password.initialValue : undefined}
            />
            {loginFields.password.errors && (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(loginFields.password.errors) ? loginFields.password.errors.join(', ') : String(loginFields.password.errors)}
              </p>
            )}
          </div>

          <Button disabled={disabled || signinPending} type="submit" className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-caption text-muted">or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="link text-body-s cursor-pointer"
            onClick={() => setOpenMagicLinkDialog(true)}
          >
            Sign in with magic link
          </button>
          <button
            type="button"
            className="link-muted text-body-s cursor-pointer"
            onClick={() => setOpenDialog(true)}
          >
            Forgot password?
          </button>
        </div>

        <p className="text-center text-body-s text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="link">
            Sign up here
          </Link>
        </p>
      </div>

      <Dialog open={openDialog}>
        <DialogContent className="sm:max-w-lg" hasClose>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <ResetPassword />
        </DialogContent>
      </Dialog>

      <Dialog open={openMagicLinkDialog} onOpenChange={setOpenMagicLinkDialog}>
        <DialogContent className="sm:max-w-lg" hasClose>
          <DialogHeader>
            <DialogTitle>Sign in with magic link</DialogTitle>
          </DialogHeader>
          <MagicLink />
        </DialogContent>
      </Dialog>
    </div>
  );
}
