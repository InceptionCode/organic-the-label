import { createSupabaseAdminClient } from "@/utils/supabase/base";

type InsertActivityEventParams = {
  eventType: string;
  eventProperties?: Record<string, unknown>;
  userId?: string | null;
  anonymousVisitorId?: string | null;
};

export async function insertActivityEvent({
  eventType,
  eventProperties = {},
  userId = null,
  anonymousVisitorId = null,
}: InsertActivityEventParams) {
  if (!userId && !anonymousVisitorId) {
    console.error("insertActivityEvent requires either userId or anonymousVisitorId");
    throw new Error("insertActivityEvent requires either userId or anonymousVisitorId");
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("activity_events").insert({
    user_id: userId,
    anonymous_visitor_id: anonymousVisitorId,
    event_type: eventType,
    event_properties: eventProperties,
  });

  if (error) {
    console.error("failed to insert activity event", error);
    throw new Error(`Failed to insert activity event: ${error.message}`);
  }
}