'use client';

import { useActionState, useEffect, useState } from 'react';
import { signupAction } from '@/app/api/auth/auth-actions';
import { SignupFormSchema } from '@/lib/schemas';
import { TextField, Button } from '@/ui-components';
import HCaptchaField from '@/app/components/auth/hcaptcha-field';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { trackActivity } from '@/utils/helpers/activity/tracking';
// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state
// NOTE: Provide magic link and google sign up
export default function SignUp() {
  const [signupState, action, pending] = useActionState(signupAction, undefined);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [signupForm, signupFields] = useForm({
    id: 'signup',
    lastResult: signupState,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: SignupFormSchema,
      });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = signupForm.valid === false || !captchaToken || pending;

  useEffect(() => {
    const didSucceed =
      signupState &&
      typeof signupState === 'object'
      && 'ok' in signupState && signupState.ok === true

    if (didSucceed) {
      trackActivity({
        eventType: 'user_signed_up',
        eventProperties: {
          email: signupFields.email.value,
          date: new Date().toISOString(),
          source: 'signup_page', // for analytics purposes later - track the trigger of the signup event
        },
      });

      redirect('/account')
    }
  }, [signupFields.email.value, pending, signupState]);

  return (
    <main>
      <form id={signupForm.id} action={action} onSubmit={signupForm.onSubmit} noValidate className="flex flex-col gap-2.5">
        {signupForm.errors ? (
          <div className="text-destructive text-sm" role="alert">
            {Array.isArray(signupForm.errors) ? signupForm.errors.join(', ') : String(signupForm.errors)}
          </div>
        ) : null}
        <TextField name={signupFields.username.name} label="Username" type="text" defaultValue={signupFields.username.initialValue} />
        <div>
          <p>{signupFields.username.errors ? (Array.isArray(signupFields.username.errors) ? signupFields.username.errors.join(', ') : String(signupFields.username.errors)) : null}</p>
          <br />
          <em>Periods, underscores, and hyphens are allowed</em>
        </div>
        <TextField name={signupFields.email.name} label="Email" type="email" defaultValue={signupFields.email.initialValue} />
        <p>{signupFields.email.errors ? (Array.isArray(signupFields.email.errors) ? signupFields.email.errors.join(', ') : String(signupFields.email.errors)) : null}</p>
        <TextField name={signupFields.password.name} label="Password" type="password" defaultValue={signupFields.password.initialValue} />

        <p>{signupFields.password.errors ? (Array.isArray(signupFields.password.errors) ? signupFields.password.errors.join(', ') : String(signupFields.password.errors)) : null}</p>
        <TextField
          name={signupFields.confirmPassword.name}
          label="Confirm Password"
          type="password"
          defaultValue={signupFields.confirmPassword.initialValue}
        />
        <p>{signupFields.confirmPassword.errors ? (Array.isArray(signupFields.confirmPassword.errors) ? signupFields.confirmPassword.errors.join(', ') : String(signupFields.confirmPassword.errors)) : null}</p>
        <input type="hidden" name="captchaToken" value={captchaToken ?? ''} />
        <div className="pt-2">
          <HCaptchaField onTokenChange={setCaptchaToken} />
        </div>
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button disabled={disabled || pending} type="submit" className="gap-y-4 sm:w-[20%]">
            Sign Up
          </Button>
          <Button disabled={pending} type="submit" variant="outline" className="gap-y-4 sm:w-[25%]">
            <Image src="/google.svg" alt="Google logo" width={20} height={20} priority />
            Sign up with Google
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
