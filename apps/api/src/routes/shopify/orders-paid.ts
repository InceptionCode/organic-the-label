import { Hono } from "hono";
import { verifyShopifyHmac } from "@organic/hmac";
import { createSupabaseAdminClient } from "../../lib/supabase.ts";

type ShopifyOrderPaidPayload = {
  id: number;
  email?: string | null;
  customer?: { id?: number | null; email?: string | null } | null;
  line_items?: Array<{ product_id?: number | null }>;
};

const toOrderGid = (id: number) => `gid://shopify/Order/${id}`;
const toCustomerGid = (id: number) => `gid://shopify/Customer/${id}`;
const toProductGid = (id: number) => `gid://shopify/Product/${id}`;

const app = new Hono();

app.post("/orders-paid", async (c) => {
  try {
    const gate = c.req.query("secret");
    if (!gate || gate !== process.env.SHOPIFY_ORDER_PAID_SECRET) {
      console.error("Unauthorized - orders/paid");
      return c.json({ ok: false, error: "Unauthorized" }, 401);
    }

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing SHOPIFY_WEBHOOK_SECRET - orders/paid");
      return c.json({ ok: false, error: "Missing SHOPIFY_WEBHOOK_SECRET" }, 500);
    }

    const rawBody = await c.req.text();
    const hmac = c.req.header("x-shopify-hmac-sha256") ?? null;

    if (!verifyShopifyHmac(rawBody, hmac, webhookSecret)) {
      console.error("Invalid HMAC - orders/paid");
      return c.json({ ok: false, error: "Invalid HMAC" }, 401);
    }

    const payload = JSON.parse(rawBody) as ShopifyOrderPaidPayload;

    const purchaserEmail =
      payload.email?.toLowerCase().trim() ||
      payload.customer?.email?.toLowerCase().trim() ||
      null;

    if (!purchaserEmail) {
      console.error("Missing purchaser email in orders/paid payload");
      return c.json({ ok: false, error: "Missing purchaser email" }, 400);
    }

    const validProductIds = (payload.line_items ?? [])
      .map((item) => item.product_id)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    if (validProductIds.length === 0) {
      console.info("No valid product ids in orders/paid payload");
      return c.json({ ok: true, inserted: 0 });
    }

    const shopifyOrderGid = toOrderGid(payload.id);
    const shopifyCustomerGid =
      typeof payload.customer?.id === "number" ? toCustomerGid(payload.customer.id) : null;

    const supabase = createSupabaseAdminClient();

    const rows = validProductIds.map((productId) => ({
      purchaser_email: purchaserEmail,
      product_gid: toProductGid(productId),
      source: "order" as const,
      shopify_order_gid: shopifyOrderGid,
      shopify_customer_gid: shopifyCustomerGid,
    }));

    const { error } = await supabase
      .from("entitlements")
      .upsert(rows, { onConflict: "purchaser_email,product_gid", ignoreDuplicates: false });

    if (error) {
      console.error("orders-paid entitlement upsert failed", {
        message: error.message,
        orderId: payload.id,
        purchaserEmail,
      });
      return c.json({ ok: false, error: "Failed to upsert entitlements" }, 500);
    }

    return c.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.error("orders-paid webhook failed", err);
    return c.json({ ok: false, error: "Unhandled webhook error" }, 500);
  }
});

export { app as ordersPayRoute };
