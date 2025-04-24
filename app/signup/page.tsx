'use client';

import { useActionState } from 'react';
import { signupAction } from '@/app/api/auth/login';
import { SignupFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import { useZorm } from 'react-zorm';
import Link from 'next/link';
// NOTE: Fully design login and signup page. Include error handling and error boundary. Add toast hookup for server failures.
export default function SignUp() {
  const zo = useZorm('signup', SignupFormSchema);
  const disabled = zo.validation?.success === false;
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <main>
      <form ref={zo.ref} action={action}>
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
        <TextField name={zo.fields.confirmPassword()} label="Password" type="password" />
        {zo.errors.confirmPassword((e) => (
          <p>{e.message}</p>
        ))}
        <Button disabled={disabled || pending} type="submit" kind="primary">
          Sign Up
        </Button>
      </form>
      <div>
        <p>
          Have an account? <Link href="/login">Sign in here...</Link>
        </p>
      </div>
    </main>
  );
}
