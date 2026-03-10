'use client';

import { useState } from 'react';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';

export function ExploreEmailSignupForm() {
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder: no backend in v1
    if (email.trim()) setEmail('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
        className="flex-1 min-w-0"
      />
      <Button type="submit" size="default" className="shrink-0">
        Join
      </Button>
    </form>
  );
}
