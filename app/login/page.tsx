'use client';

import { useActionState } from 'react';
import { signinAction } from '@/app/api/auth/login';
import { SigninFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import { useZorm } from 'react-zorm';
import Link from 'next/link';

// NOTE: Fully design login and signup page. Include error handling and error boundary. Display toast for login failure.
export default function Login() {
  const zo = useZorm('login', SigninFormSchema);
  const disabled = zo.validation?.success === false;
  const [state, action, pending] = useActionState(signinAction, undefined);

  return (
    <main>
      <form ref={zo.ref} action={action}>
        <TextField name={zo.fields.email()} label="Email" type="email" />
        {zo.errors.email((e) => (
          <p>{e.message}</p>
        ))}
        <TextField name={zo.fields.password()} label="Password" type="password" />
        {zo.errors.password((e) => (
          <p>{e.message}</p>
        ))}
        <Button disabled={disabled || pending} type="submit" kind="primary">
          Sign In
        </Button>
      </form>
      <p>Sign in with Google:</p>
      <p>Or sign in with magic link</p>
      <div>
        <p>
          Don&apos;t have an account? <Link href="/signup">Sign up here...</Link>
        </p>
      </div>
    </main>
  );
}
