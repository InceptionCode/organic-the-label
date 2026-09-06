'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/ui-components';

type Status = 'idle' | 'loading' | 'done';

export default function NewsletterSignupForm() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Check the consent box to continue.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          source: 'newsletter_page',
          marketingOptIn: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
        setStatus('idle');
        return;
      }
      setStatus('done');
    } catch {
      setError('Something went wrong. Try again.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-[color:var(--accent-primary)]/30 bg-[color:var(--accent-primary-soft)] px-6 py-5">
        <p className="text-body-m font-medium text-primary">
          You&apos;re on the list. Check your inbox to confirm.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-5 shadow-sm-premium"
    >
      {error && (
        <p role="alert" aria-live="polite" className="text-body-s text-[color:var(--danger)]">
          {error}
        </p>
      )}

      <label className="text-body-s text-secondary" htmlFor="newsletter-first-name">
        First name <span className="text-muted">(optional)</span>
      </label>
      <Input
        id="newsletter-first-name"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        autoComplete="given-name"
      />

      <label className="text-body-s text-secondary" htmlFor="newsletter-email">
        Email
      </label>
      <Input
        id="newsletter-email"
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label className="mt-1 flex items-start gap-2.5 text-caption text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-default accent-[color:var(--accent-primary)]"
        />
        I agree to receive marketing emails from Organic Sonics. Unsubscribe anytime.
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={status === 'loading'}
        aria-busy={status === 'loading'}
        className="mt-1"
      >
        {status === 'loading' ? 'Signing up…' : 'Subscribe'}
      </Button>
    </form>
  );
}
