import { createHmac } from "node:crypto";

// Vercel CDN purge for the v2 site (v2 phase 07.8). After a Redis bust, cache.ts POSTs the matching
// cache tags to ${V2_SITE_URL}/api/cache/purge, signed with CACHE_PURGE_SECRET. Non-fatal by design:
// Redis is the source of truth and v2's CDN copies expire within 60s anyway, so a failed purge is
// logged and never fails or retries the webhook. v1 is not involved.

const TAG = "[cache]";
const PURGE_PATH = "/api/cache/purge";
// Under Shopify's 5s webhook deadline, so a hung purge cannot turn into a webhook timeout and retry.
const TIMEOUT_MS = 3000;

let warnedMissingEnv = false;

/** Hex HMAC-SHA256 of `${timestamp}.${rawBody}`; must match apps/v2/src/server/cache/purge.ts. */
export function signPurge(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

// Same rule as v2's PRODUCT_HANDLE_TAG: v2 rejects the whole purge on an unknown tag, so a handle
// outside it is dropped here and `products` (which every v2 page carries) still goes through.
const PRODUCT_HANDLE = /^[a-z0-9][a-z0-9-]{0,199}$/;

/** Tags for a product bust: `product:{handle}` + `products` with a valid handle, else `products`. */
export function productPurgeTags(handle?: string): string[] {
  return handle && PRODUCT_HANDLE.test(handle) ? [`product:${handle}`, "products"] : ["products"];
}

/** Test hook: lets each test see the one-time missing env warning again. */
export function resetCdnPurgeWarning(): void {
  warnedMissingEnv = false;
}

/** Resolves true when v2 accepted the purge; never throws. */
export async function purgeCdnTags(tags: string[]): Promise<boolean> {
  const secret = process.env.CACHE_PURGE_SECRET;
  const siteUrl = process.env.V2_SITE_URL?.replace(/\/+$/, "");
  if (!secret || !siteUrl) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(`${TAG} CDN purge skipped: CACHE_PURGE_SECRET or V2_SITE_URL is not set`);
    }
    return false;
  }

  const body = JSON.stringify({ tags });
  const timestamp = String(Math.floor(Date.now() / 1000));
  try {
    const res = await fetch(`${siteUrl}${PURGE_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Purge-Timestamp": timestamp,
        "X-Purge-Signature": signPurge(secret, timestamp, body),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`${TAG} CDN purge failed`, { tags, status: res.status });
      return false;
    }
    console.info(`${TAG} CDN purged`, { tags });
    return true;
  } catch (err) {
    console.error(`${TAG} CDN purge failed`, { tags, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
