'use client';

import { useActionState, useEffect, useState } from 'react';
import { signinAction } from '@/app/api/auth/login';
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
import Image from 'next/image';
import { resetPasswordRequest } from '@/app/api/auth/reset-password-request';
import { trackActivity } from '@/utils/helpers/activity/tracking';
import { redirect } from 'next/navigation';

// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
// NOTE: Include magic link and Google sign in
export default function Login() {
  const [signinState, signinSubmitAction, signinPending] = useActionState(signinAction, undefined);
  const [resetState, resetSubmitAction, resetPending] = useActionState(
    resetPasswordRequest,
    undefined,
  );

  const [loginForm, loginFields] = useForm({
    id: 'login',
    lastResult: signinState,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SigninFormSchema,
      });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });
  const [resetPassForm, resetPassFields] = useForm({
    id: 'reset',
    lastResult: resetState,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SigninFormSchema.pick({ email: true }),
      });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = loginForm.valid === false;

  const [openDialog, setOpenDialog] = useState<boolean>(false);

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
          <div className="text-destructive text-sm" role="alert">
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
            disabled={signinPending}
            type="submit"
            variant="outline"
            className="gap-y-4 sm:w-[25%]"
          >
            <Image src="/google.svg" alt="Google logo" width={20} height={20} priority />
            Sign in with Google
          </Button>
          <p className="text-sm">
            Or sign in with <a className=""> magic link</a>
          </p>
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
            <DialogTitle>Enter email</DialogTitle>
          </DialogHeader>
          <form id={resetPassForm.id} action={resetSubmitAction} onSubmit={resetPassForm.onSubmit} noValidate className="flex flex-col gap-2">
            {resetPassForm.errors ? (
              <div className="text-destructive text-sm dark:invert" role="alert">
                {Array.isArray(resetPassForm.errors) ? resetPassForm.errors.join(', ') : String(resetPassForm.errors)}
              </div>
            ) : null}
            <TextField name={resetPassFields.email.name} label="Email" type="email" invert defaultValue={typeof resetPassFields.email.initialValue === 'string' ? resetPassFields.email.initialValue : undefined} />
            <p className="dark:invert">{resetPassFields.email.errors ? (Array.isArray(resetPassFields.email.errors) ? resetPassFields.email.errors.join(', ') : String(resetPassFields.email.errors)) : null}</p>
            <Button
              disabled={resetPending}
              type="submit"
              className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs sm:ml-3 sm:w-auto hover:cursor-pointer"
              onClick={() => setOpenDialog(false)}
            >
              Reset Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
