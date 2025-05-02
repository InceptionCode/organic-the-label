/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useActionState, useEffect } from 'react';
import { UpdateUserFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import { useZorm } from 'react-zorm';

import { updateUserAction } from '@/app/api/auth/update-user';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui-components/card';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
export default function ResetPassword() {
  const router = useRouter();

  const zo = useZorm('updatePassword', UpdateUserFormSchema);

  const disabled = zo.validation?.success === false;
  const [state, action, pending] = useActionState(updateUserAction, undefined);

  useEffect(() => {
    if (!pending && state?.ok) {
      router.replace('/account');
    }
  }, [pending, router, state?.ok]);

  return (
    <main className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            <ShieldExclamationIcon className="size-10 inline-flex pr-2" />
            Update Password
          </CardTitle>
          <CardDescription>
            Please update and confirm your new password. This action could cause other open sessions
            to close or logout.
          </CardDescription>
        </CardHeader>
      </Card>
      <form ref={zo.ref} action={action} className="flex flex-col gap-2.5">
        <TextField name={zo.fields.password()} label="Password" type="password" />
        {zo.errors.password((e) => (
          <p>{e.message}</p>
        ))}
        <TextField name={zo.fields.confirmPassword()} label="Confirm Password" type="password" />
        {zo.errors.confirmPassword((e) => (
          <p>{e.message}</p>
        ))}
        <div className="flex justify-end items-center gap-4 pt-2">
          <Button variant="secondary" onClick={() => router.replace('/login')}>
            Cancel
          </Button>
          <Button disabled={disabled || pending} type="submit">
            Reset Password
          </Button>
        </div>
      </form>
    </main>
  );
}
