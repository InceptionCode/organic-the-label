import { Redis } from "@upstash/redis";
import { productPurgeTags, purgeCdnTags } from "./cdn-purge.ts";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

async function scanAndDelete(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    console.warn(`[cache] Redis not configured — skipping pattern delete: ${pattern}`);
    return 0;
  }
  let cursor = 0;
  let deleted = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(nextCursor);
    if (keys.length > 0) {
      await redis.del(...(keys as [string, ...string[]]));
      deleted += keys.length;
    }
  } while (cursor !== 0);
  return deleted;
}

// Each bust clears Redis first, then asks v2 to purge the Vercel CDN tags for the same family
// (cdn-purge.ts). The purge never throws, so a CDN failure cannot fail or retry the webhook; a Redis
// failure still throws before the purge, exactly as before.

export async function bustProductCache(handle?: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[cache] Redis not configured — skipping product cache bust");
  } else {
    if (handle) {
      await redis.del(`product:handle:${handle}`);
    }
    await scanAndDelete("shopify:products:*");
  }
  await purgeCdnTags(productPurgeTags(handle));
}

export async function bustCompositionsCache(): Promise<void> {
  await scanAndDelete("compositions:*");
  await purgeCdnTags(["compositions"]);
}

export async function bustFreeResourcesCache(): Promise<void> {
  await scanAndDelete("free-resources:*");
  await purgeCdnTags(["free-resources"]);
}
