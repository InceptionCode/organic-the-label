'use client';

import { useActionState } from 'react';
import { signupAction } from '@/app/api/auth/login';
import { SignupFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';

import Link from 'next/link';
import Image from 'next/image';
// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
// NOTE: Provide magic link and google sign up
export default function SignUp() {
  const [signupForm, signupFields] = useForm({
    id: 'signup',
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SignupFormSchema,
      });
    },
  });
  const disabled = signupForm.valid === false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, action, pending] = useActionState(signupAction, undefined);

  return (
    <main>
      <form id={signupForm.id} action={action} className="flex flex-col gap-2.5">
        <TextField name={signupFields.username.name} label="Username" type="text" />
        <div>
          <p>{signupFields.username.errors}</p>
          <br />
          <em>Periods, underscores, and hyphens are allowed</em>
        </div>
        <TextField name={signupFields.email.name} label="Email" type="email" />
        <p>{signupFields.email.errors}</p>
        <TextField name={signupFields.password.name} label="Password" type="password" />

        <p>{signupFields.password.errors}</p>
        <TextField
          name={signupFields.confirmPassword.name}
          label="Confirm Password"
          type="password"
        />
        <p>{signupFields.confirmPassword.errors}</p>
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
