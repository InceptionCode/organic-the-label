'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/ui-components';

export function DismissMembershipCtaButton() {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    try {
      const res = await fetch('/api/membership-cta/dismiss', { method: 'POST' });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="default"
      onClick={handleDismiss}
      disabled={isDismissing}
      aria-label="Dismiss membership signup offer"
    >
      No Thanks
    </Button>
  );
}
