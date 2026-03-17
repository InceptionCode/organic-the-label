"use client";

import { useEffect } from "react";
import { useActivityTrackerStore } from "@/lib/store";

export default function ActivityHydrator() {
  const isInitializing = useActivityTrackerStore((s) => s.isInitializing);
  const hasInitialized = useActivityTrackerStore((s) => s.hasInitialized);
  const setInitializing = useActivityTrackerStore((s) => s.setInitializing);
  const setReady = useActivityTrackerStore((s) => s.setReady);
  const setError = useActivityTrackerStore((s) => s.setError);

  useEffect(() => {
    if (isInitializing || hasInitialized) return;

    async function init() {
      try {
        setInitializing();

        const res = await fetch("/api/auth/init", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Anonymous init failed with status ${res.status}`);
        }

        setReady();
      } catch (error) {
        console.error("ActivityHydrator init failed", error);
        setError(error instanceof Error ? error.message : "Anonymous init failed");
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [setError, setInitializing, setReady]);

  return null;
}

export function useTrackingReady() {
  return useActivityTrackerStore((s) => s.isReady);
}