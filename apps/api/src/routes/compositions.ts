import { Hono } from "hono";
import { bustCompositionsCache, bustFreeResourcesCache } from "../lib/cache.ts";
import { verifySharedSecret } from "../middleware/auth.ts";
import { compositionWebhookSchema, type CompositionWebhookPayload } from "../schemas/index.ts";

const TAG = "[/webhooks/compositions]";

const TABLE_BUST: Record<string, () => Promise<void>> = {
  compositions: bustCompositionsCache,
  free_resources: bustFreeResourcesCache,
};

const app = new Hono();

app.post("/compositions", async (c) => {
  console.info(`${TAG} received`);

  if (!verifySharedSecret(c.req.header("x-webhook-secret") ?? null, "INTERNAL_SUPABASE_WEBHOOK_SECRET")) {
    console.error(`${TAG} unauthorized`);
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  let payload: CompositionWebhookPayload;
  try {
    payload = compositionWebhookSchema.parse(await c.req.json());
  } catch {
    return c.json({ ok: false, error: "Invalid payload" }, 400);
  }

  const bust = (payload.table && TABLE_BUST[payload.table]) || bustCompositionsCache;

  try {
    await bust();
  } catch (err) {
    // Return 500 so Supabase retries; cache busts are idempotent so a retry is safe.
    console.error(`${TAG} cache bust failed`, { table: payload.table, err });
    return c.json({ ok: false, error: "Cache bust failed" }, 500);
  }

  const slug = payload.record?.slug ?? payload.old_record?.slug ?? null;
  console.info(`${TAG} cache busted`, { event: payload.type, slug, table: payload.table });

  return c.json({ ok: true, revalidated: true });
});

export { app as compositionsRoute };
