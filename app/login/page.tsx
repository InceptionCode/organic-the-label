/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useActionState, useState } from 'react';
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

// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
// NOTE: Include magic link and Google sign in
export default function Login() {
  const [loginForm, loginFields] = useForm({
    id: 'login',
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SigninFormSchema,
      });
    },
  });
  const [resetPassForm, resetPassFields] = useForm({
    id: 'reset',
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SigninFormSchema.pick({ email: true }),
      });
    },
  });

  const disabled = loginForm.valid === false;
  const [signinState, signinSubmitAction, signinPending] = useActionState(signinAction, undefined);
  const [resetState, resetSubmitAction, resetPending] = useActionState(
    resetPasswordRequest,
    undefined,
  );

  const [openDialog, setOpenDialog] = useState<boolean>(false);

  return (
    <main>
      <form id={loginForm.id} action={signinSubmitAction} className="flex flex-col gap-2.5">
        <TextField name={loginFields.email.name} label="Email" type="email" />
        <p>{loginFields.email.errors}</p>
        <TextField name={loginFields.password.name} label="Password" type="password" />
        <p>{loginFields.password.errors}</p>
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
          <form id={resetPassForm.id} className="flex flex-col gap-2" action={resetSubmitAction}>
            <TextField name={resetPassFields.email.name} label="Email" type="email" invert />
            <p className="dark:invert">{resetPassFields.email.errors}</p>
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
