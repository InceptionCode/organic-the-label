import crypto from "crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string) {
  if (!hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  // Extra gate (optional but recommended)
  const url = new URL(req.url);
  const gate = url.searchParams.get("secret");

  if (!gate || gate !== process.env.SHOPIFY_REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing SHOPIFY_WEBHOOK_SECRET" }, { status: 500 });
  }

  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyHmac(rawBody, hmac, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid HMAC" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { handle?: string; id?: number };

  // Invalidate by handle (best)
  if (payload.handle) {
    revalidateTag(`product:handle:${payload.handle}`, "max");
  }

  return NextResponse.json({ ok: true });
}