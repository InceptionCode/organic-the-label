import { Hono } from "hono";
import { createHash, timingSafeEqual } from "crypto";
import { refreshInstagramToken, seedInstagramTokenFromEnv } from "../lib/instagram/token.ts";

const TAG = "[/cron/instagram-refresh]";

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
  const h = req.headers as { get(name: string): string | null | undefined }
  const bearer = h.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = bearer || h.get("x-cron-secret") || "";
  if (!provided) return false;

  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

const app = new Hono();

app.get("/instagram-refresh", async (c) => {
  if (!authorized(c.req.raw)) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const seed = c.req.query("seed") === "1";
  console.info(`${TAG} start`, { seed });

  const result = seed ? await seedInstagramTokenFromEnv() : await refreshInstagramToken();

  console.info(`${TAG} done`, result);
  return c.json(result, result.ok ? 200 : 502);
});

export { app as instagramRefreshRoute };
