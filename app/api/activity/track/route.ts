// app/api/activity/track/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE_NAME } from "@/lib/constants";
import { ensureAnonymousVisitor } from "@/lib/supabase/ensure-anon-visitor";
import { activityEventSchema } from "@/lib/supabase/anon-event.schema";
import { createSupabasePrivateClient } from "@/lib/supabase/base";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = activityEventSchema.safeParse(body);

    if (!parsed.success) {
      console.error("invalid activity event payload", parsed.error);
      return NextResponse.json(
        { ok: false, error: "Invalid activity event payload" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const anonToken = cookieStore.get(ANON_COOKIE_NAME)?.value;

    if (!anonToken) {
      console.error("missing anonymous token");
      return NextResponse.json(
        { ok: false, error: "Missing anonymous token" },
        { status: 400 }
      );
    }

    const visitor = await ensureAnonymousVisitor(anonToken);
    const supabase = await createSupabasePrivateClient();

    const { error } = await supabase.from("activity_events").insert({
      anonymous_visitor_id: visitor.id,
      event_type: parsed.data.eventType,
      event_properties: parsed.data.eventProperties,
    });

    if (error) {
      console.error("failed to insert activity event", error);
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("activity track failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to track activity" },
      { status: 500 }
    );
  }
}