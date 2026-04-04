import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE_MAX_AGE, ANON_COOKIE_NAME } from "@/lib/constants";
import { ensureAnonymousVisitor } from "@/lib/supabase/ensure-anon-visitor";
import { activityEventSchema } from "@/lib/supabase/event.schema";
import { createSupabaseServerClient } from "@/utils/supabase/server-base";
import { insertActivityEvent } from "@/lib/supabase/insert-activity-event";
import { generateToken } from "@/utils/helpers/token";

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

    const supabaseServerClient = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseServerClient.auth.getUser();

    if (authError) {
      console.error("activity auth lookup failed", authError);
    }

    if (user) {
      await insertActivityEvent({
        eventType: parsed.data.eventType,
        eventProperties: parsed.data.eventProperties ?? {},
        userId: user.id,
      });

      console.info("activity event inserted for authenticated user", user.id);

      return NextResponse.json({ ok: true, actor: "user" });
    }

    const cookieStore = await cookies();
    let anonToken = cookieStore.get(ANON_COOKIE_NAME)?.value;
    let shouldSetCookie = false;

    if (!anonToken) {
      anonToken = generateToken();
      shouldSetCookie = true;
    }

    const visitor = await ensureAnonymousVisitor(anonToken);
    await insertActivityEvent({
      eventType: parsed.data.eventType,
      eventProperties: parsed.data.eventProperties ?? {},
      anonymousVisitorId: visitor.id,
    });

    console.info("activity event inserted for anonymous visitor", visitor.id);

    const response = NextResponse.json({ ok: true, actor: "anonymous visitor" });

    if (shouldSetCookie) {
      response.cookies.set({
        name: ANON_COOKIE_NAME,
        value: anonToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ANON_COOKIE_MAX_AGE,
      });
    }

    return response;

  } catch (error) {
    console.error("activity track failed", error);

    return NextResponse.json(
      { ok: false, error: "Failed to track activity" },
      { status: 500 }
    );
  }
}