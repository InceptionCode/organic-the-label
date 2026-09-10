/**
 * Weekly refresh of the Instagram long-lived access token.
 *
 */

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { refreshInstagramToken, seedInstagramTokenFromEnv } from "@/lib/instagram/token";

const TAG = "[/api/cron/instagram-refresh]";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(`${TAG} CRON_SECRET is not set — refusing`);
      return false;
    }
    console.warn(`${TAG} CRON_SECRET not set — allowing through (non-production only)`);
    return true;
  }
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = bearer || req.headers.get("x-cron-secret") || "";
  if (!provided) return false;

  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const seed = new URL(req.url).searchParams.get("seed") === "1";
  console.info(`${TAG} start`, { seed });

  const result = seed ? await seedInstagramTokenFromEnv() : await refreshInstagramToken();

  console.info(`${TAG} done`, result);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
