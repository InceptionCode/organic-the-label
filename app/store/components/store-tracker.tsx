'use client';

import { useEffect } from 'react';

import type { ActivityEventType } from '@/lib/supabase/event.schema';
import { useTrackingReady } from '@/store/activity-hydrator';
import { trackActivity } from '@/utils/helpers/activity/tracking';

export default function StoreTracker({
  eventType = 'store_viewed',
}: {
  eventType?: ActivityEventType;
}) {
  const isTrackingReady = useTrackingReady();

  useEffect(() => {
    if (!isTrackingReady) return;
    trackActivity({ eventType });
  }, [isTrackingReady, eventType]);

  return null;
}

