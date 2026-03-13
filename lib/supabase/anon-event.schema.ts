// lib/anonymous/eventSchema.ts
import { z } from "zod";

export const activityEventSchema = z.object({
  eventType: z.enum([
    "product_viewed",
    "audio_preview_played",
    "collection_viewed",
    "cart_opened",
    "homepage_viewed",
    "user_signed_up",
    "user_signed_in",
    "explore_viewed",
  ]),
  eventProperties: z.record(z.string(), z.unknown()).default({}),
});

export type ActivityEventInput = z.infer<typeof activityEventSchema>;
export type ActivityEventType = `${ActivityEventInput["eventType"]}`;