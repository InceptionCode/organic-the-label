"use client";

import { useEffect } from "react";
import { trackActivity } from "@/utils/helpers/activity/tracking";

export default function ExploreViewTracker() {
  useEffect(() => {
    trackActivity({
      eventType: "explore_viewed",
    });
  }, []);

  return null;
}

