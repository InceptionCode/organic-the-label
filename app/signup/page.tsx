'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { signupAction } from '@/app/api/auth/auth-actions';
import { SignupFormSchema } from '@/lib/schemas';
import { TextField, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui-components';
import HCaptchaField from '@/app/components/auth/hcaptcha-field';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { trackActivity } from '@/utils/helpers/activity/tracking';
// TODO: Include error handling and error boundary. Display toast for login failure. Display toast for successful state.
// Later version will include the option to sign up via the Google provider.

export default function SignUp() {
  const [signupState, action, pending] = useActionState(signupAction, undefined);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const prevSignupStateRef = useRef<typeof signupState>(undefined);
  const lastResult = signupState && typeof signupState === 'object' && !('ok' in signupState) ? signupState : null;

  const signupSucceeded =
    signupState != null &&
    typeof signupState === 'object' &&
    'ok' in signupState &&
    signupState.ok === true;

  const [signupForm, signupFields] = useForm({
    id: 'signup',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupFormSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const disabled = signupForm.valid === false || !captchaToken || pending;

  useEffect(() => {
    const prev = prevSignupStateRef.current;
    prevSignupStateRef.current = signupState;

    const prevSucceeded =
      prev != null &&
      typeof prev === 'object' &&
      'ok' in prev &&
      prev.ok === true;

    if (signupSucceeded && !prevSucceeded) {
      trackActivity({
        eventType: 'user_signed_up',
        eventProperties: {
          email: signupFields.email.value,
          date: new Date().toISOString(),
          source: 'signup_page', // for analytics purposes later - track the trigger of the signup event
        },
      });
    }
  }, [signupFields.email.value, signupSucceeded, signupState]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-md rounded-xl p-8 space-y-6"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="space-y-1">
          <p className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>Free membership</p>
          <h1
            className="text-primary"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', letterSpacing: '0.02em', lineHeight: 1 }}
          >
            CREATE ACCOUNT
          </h1>
        </div>

        <form
          id={signupForm.id}
          action={action}
          onSubmit={signupForm.onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {signupForm.errors ? (
            <div className="text-body-s px-3 py-2 rounded-md" style={{ background: 'rgba(224,61,42,0.10)', color: 'var(--danger)' }} role="alert">
              {Array.isArray(signupForm.errors) ? signupForm.errors.join(', ') : String(signupForm.errors)}
            </div>
          ) : null}

          <div className="space-y-1">
            <TextField name={signupFields.username.name} label="Username" type="text" defaultValue={signupFields.username.initialValue} />
            {signupFields.username.errors ? (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(signupFields.username.errors) ? signupFields.username.errors.join(', ') : String(signupFields.username.errors)}
              </p>
            ) : (
              <p className="text-caption text-muted">Periods, underscores, and hyphens are allowed</p>
            )}
          </div>

          <div className="space-y-1">
            <TextField name={signupFields.email.name} label="Email" type="email" defaultValue={signupFields.email.initialValue} />
            {signupFields.email.errors && (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(signupFields.email.errors) ? signupFields.email.errors.join(', ') : String(signupFields.email.errors)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <TextField name={signupFields.password.name} label="Password" type="password" defaultValue={signupFields.password.initialValue} />
            {signupFields.password.errors && (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(signupFields.password.errors) ? signupFields.password.errors.join(', ') : String(signupFields.password.errors)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <TextField
              name={signupFields.confirmPassword.name}
              label="Confirm Password"
              type="password"
              defaultValue={signupFields.confirmPassword.initialValue}
            />
            {signupFields.confirmPassword.errors && (
              <p className="text-body-s" style={{ color: 'var(--danger)' }}>
                {Array.isArray(signupFields.confirmPassword.errors) ? signupFields.confirmPassword.errors.join(', ') : String(signupFields.confirmPassword.errors)}
              </p>
            )}
          </div>

          <input type="hidden" name="captchaToken" value={captchaToken ?? ''} />
          <HCaptchaField onTokenChange={setCaptchaToken} />

          <Button disabled={disabled || pending} type="submit" className="w-full mt-2">
            Create account
          </Button>
        </form>
        <p className="text-center text-body-s text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="link">
            Sign in here
          </Link>
        </p>
      </div>

      <Dialog open={signupSucceeded}>
        <DialogContent className="sm:max-w-md" style={{ textAlign: 'center' }}>
          <DialogHeader>
            <div
              className="mx-auto mb-3 flex items-center justify-center rounded-full"
              style={{
                width: '3rem',
                height: '3rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--accent-secondary)' }}
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', letterSpacing: '0.02em' }}>
              CHECK YOUR EMAIL
            </DialogTitle>
            <DialogDescription className="text-body-s text-secondary" style={{ marginTop: '0.5rem' }}>
              We sent a confirmation link to{' '}
              <span className="text-primary" style={{ fontWeight: 500 }}>
                {signupFields.email.value}
              </span>
              . Click the link in that email to activate your account and continue to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
