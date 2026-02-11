'use client';

import type { AuthStore } from '@/lib/store';

export default function Recommendations({ user }: { user: AuthStore['user'] }) {
  const recommendations = user?.preferences?.interests;
  return (
    <div>
      Current interest {recommendations} will eventually become full logic on recommendations
    </div>
  );
}
