
import { NextResponse } from "next/server";
import { verifyShopifyHmac } from "@/utils/helpers/shopify/verify-hmac";
import { createSupabaseAdminClient } from "@/utils/supabase/base";
import type { ShopifyOrderPaidPayload } from "@/lib/schemas";
import { toOrderGid, toCustomerGid, toProductGid } from "@/utils/helpers/shopify/to-shopify-gid";

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}


export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const gate = url.searchParams.get("secret");

    if (!gate || gate !== process.env.SHOPIFY_ORDER_PAID_SECRET) {
      console.error("Unauthorized - orders/paid");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing SHOPIFY_WEBHOOK_SECRET - orders/paid");

      return NextResponse.json(
        { ok: false, error: "Missing SHOPIFY_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const hmac = req.headers.get("x-shopify-hmac-sha256");

    if (!verifyShopifyHmac(rawBody, hmac, webhookSecret)) {
      console.error("Invalid HMAC");
      return NextResponse.json({ ok: false, error: "Invalid HMAC" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ShopifyOrderPaidPayload;

    const purchaserEmail =
      payload.email?.toLowerCase().trim() ||
      payload.customer?.email?.toLowerCase().trim() ||
      null;

    if (!purchaserEmail) {
      console.error("Missing purchaser email in orders/paid payload");
      return NextResponse.json(
        { ok: false, error: "Missing purchaser email in orders/paid payload" },
        { status: 400 }
      );
    }

    const lineItems = payload.line_items ?? [];
    const validProductIds = lineItems
      .map((item) => item.product_id)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    if (validProductIds.length === 0) {
      console.info("No valid product ids in orders/paid payload");
      return NextResponse.json({ ok: true, inserted: 0 });
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
      .upsert(rows, {
        onConflict: "purchaser_email,product_gid",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("orders-paid entitlement upsert failed", {
        message: error.message,
        orderId: payload.id,
        purchaserEmail,
      });

      return NextResponse.json(
        { ok: false, error: "Failed to upsert entitlements" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: rows.length,
    });
  } catch (error) {
    console.error("orders-paid webhook failed", error);

    return NextResponse.json(
      { ok: false, error: "Unhandled webhook error" },
      { status: 500 }
    );
  }
}