import { Hono } from "hono";
import { verifyShopifyHmac } from "@organic/hmac";
import { bustProductCache } from "../../lib/cache.ts";

const app = new Hono();

app.post("/revalidate-product", async (c) => {
  const gate = c.req.query("secret");
  if (!gate || gate !== process.env.SHOPIFY_REVALIDATE_SECRET) {
    console.error("Unauthorized - revalidate-product");
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return c.json({ ok: false, error: "Missing SHOPIFY_WEBHOOK_SECRET" }, 500);
  }

  const rawBody = await c.req.text();
  const hmac = c.req.header("x-shopify-hmac-sha256") ?? null;

  if (!verifyShopifyHmac(rawBody, hmac, webhookSecret)) {
    console.error("Invalid HMAC - revalidate-product");
    return c.json({ ok: false, error: "Invalid HMAC" }, 401);
  }

  let payload: { handle?: string; id?: number };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (payload.handle) {
    console.log(`Busting product cache: ${payload.handle}`);
  }
  await bustProductCache(payload.handle);

  return c.json({ ok: true });
});

export { app as revalidateProductRoute };
