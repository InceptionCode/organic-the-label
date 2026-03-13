import { ActivityEventType } from "@/lib/supabase/anon-event.schema";

type TrackActivityInput = {
  eventType: ActivityEventType;
  eventProperties?: Record<string, unknown>;
};

export async function trackActivity({
  eventType,
  eventProperties = {},
}: TrackActivityInput) {
  try {
    await fetch("/api/activity/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        eventType,
        eventProperties,
      }),
    });
  } catch {
    // Silent fail for MVP
  }
}