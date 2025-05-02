'use client';

import { useActionState } from 'react';
import { signupAction } from '@/app/api/auth/login';
import { SignupFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import { useZorm } from 'react-zorm';
import Link from 'next/link';
import Image from 'next/image';
// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
// NOTE: Provide magic link and google sign up
export default function SignUp() {
  const zo = useZorm('signup', SignupFormSchema);
  const disabled = zo.validation?.success === false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, action, pending] = useActionState(signupAction, undefined);

  return (
    <main>
      <form ref={zo.ref} action={action} className="flex flex-col gap-2.5">
        <TextField name={zo.fields.username()} label="Username" type="text" />
        {zo.errors.username((e) => (
          <div>
            <p>{e.message}</p>
            <br />
            <em>Periods, underscores, and hyphens are allowed</em>
          </div>
        ))}
        <TextField name={zo.fields.email()} label="Email" type="email" />
        {zo.errors.email((e) => (
          <p>{e.message}</p>
        ))}
        <TextField name={zo.fields.password()} label="Password" type="password" />
        {zo.errors.password((e) => (
          <p>{e.message}</p>
        ))}
        <TextField name={zo.fields.confirmPassword()} label="Confirm Password" type="password" />
        {zo.errors.confirmPassword((e) => (
          <p>{e.message}</p>
        ))}
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button disabled={disabled || pending} type="submit" className="gap-y-4 sm:w-[20%]">
            Sign In
          </Button>
          <Button disabled={pending} type="submit" variant="outline" className="gap-y-4 sm:w-[25%]">
            <Image src="/google.svg" alt="Google logo" width={20} height={20} priority />
            Sign in with Google
          </Button>
          <p className="text-sm">
            Or sign in with <a className=""> magic link</a>
          </p>
          <div>
            <p>
              Have an account? <Link href="/login">Sign in here...</Link>
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
