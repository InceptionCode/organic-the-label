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
      return parseWithZod(formData, {
        schema: SigninFormSchema,
      });
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
        eventType: "user_signed_in",
        eventProperties: {
          email: loginFields.email.value,
          date: new Date().toISOString(),
          source: "login_page" // for analytics purposes later - track the trigger of the login event
        },
      });

      fetch('/api/auth/bootstrap', {
        method: 'POST',
        credentials: 'include',
      }).then(res => res.json()).then(data => {
        if (data.ok) redirect('/explore');
      });
    }
  }, [loginFields.email.value, signinState]);

  return (
    <main>
      <form id={loginForm.id} action={signinSubmitAction} onSubmit={loginForm.onSubmit} noValidate className="flex flex-col gap-2.5">
        {loginForm.errors ? (
          <div className="text-danger text-sm" role="alert">
            {Array.isArray(loginForm.errors) ? loginForm.errors.join(', ') : String(loginForm.errors)}
          </div>
        ) : null}
        <TextField name={loginFields.email.name} label="Email" type="email" defaultValue={typeof loginFields.email.initialValue === 'string' ? loginFields.email.initialValue : undefined} />
        <p>{loginFields.email.errors ? (Array.isArray(loginFields.email.errors) ? loginFields.email.errors.join(', ') : String(loginFields.email.errors)) : null}</p>
        <TextField name={loginFields.password.name} label="Password" type="password" defaultValue={typeof loginFields.password.initialValue === 'string' ? loginFields.password.initialValue : undefined} />
        <p>{loginFields.password.errors ? (Array.isArray(loginFields.password.errors) ? loginFields.password.errors.join(', ') : String(loginFields.password.errors)) : null}</p>
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button disabled={disabled || signinPending} type="submit" className="gap-y-4 sm:w-[20%]">
            Sign In
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-sm"
            onClick={() => setOpenMagicLinkDialog(true)}
          >
            Or sign in with magic link
          </Button>
          <div>
            <p>
              Don&apos;t have an account? <Link href="/signup">Sign up here...</Link>
            </p>
          </div>
        </div>
      </form>
      <div className="flex flex-col items-center m-auto pt-2 w-full max-w-md">
        <hr className="bt-2 pb-2 border-black dark:border-white/50 w-full" />
        <a
          className="text-blue-500 dark:text-blue-600 text-sm transition-all hover:cursor-pointer hover:scale-110"
          onClick={() => setOpenDialog(true)}
        >
          Forgot Password?
        </a>
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
    </main>
  );
}
