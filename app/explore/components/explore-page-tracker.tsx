"use client";

import { useEffect } from "react";
import { trackActivity } from "@/utils/helpers/activity/tracking";
import { useTrackingReady } from "@/store/activity-hydrator";

export default function ExploreViewTracker() {
  const isTrackingReady = useTrackingReady();
  useEffect(() => {
    if (isTrackingReady) {
      trackActivity({
        eventType: "explore_viewed",
      });
    }
  }, [isTrackingReady]);

  return null;
}

