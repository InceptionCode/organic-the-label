import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHmac } from "node:crypto";
import { bustCompositionsCache, bustFreeResourcesCache, bustProductCache } from "../src/lib/cache.ts";
import { productPurgeTags, purgeCdnTags, resetCdnPurgeWarning } from "../src/lib/cdn-purge.ts";

// Fake fetch only: no request leaves the process. Redis env is unset, so the busts skip Redis and
// exercise just the CDN purge.

const SECRET = "test-secret-0123456789abcdef0123456789abcdef";
const SITE = "https://v2.example.test";
const realFetch = globalThis.fetch;
const saved = { ...process.env };

type Call = { url: string; init: RequestInit };
let calls: Call[];
let respond: () => Promise<Response>;

beforeEach(() => {
  calls = [];
  respond = async () => Response.json({ ok: true }, { status: 200 });
  globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return respond();
  }) as unknown as typeof fetch;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.CACHE_PURGE_SECRET = SECRET;
  process.env.V2_SITE_URL = `${SITE}/`;
  resetCdnPurgeWarning();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env = { ...saved };
  mock.restore();
});

const header = (call: Call, name: string) => new Headers(call.init.headers).get(name);
const tagsOf = (call: Call) => (JSON.parse(String(call.init.body)) as { tags: string[] }).tags;

describe("purgeCdnTags", () => {
  test("POSTs to V2_SITE_URL/api/cache/purge, signed over timestamp and raw body", async () => {
    expect(await purgeCdnTags(["compositions"])).toBe(true);
    expect(calls).toHaveLength(1);
    const [call] = calls as [Call];
    expect(call.url).toBe(`${SITE}/api/cache/purge`);
    expect(call.init.method).toBe("POST");
    const timestamp = header(call, "x-purge-timestamp")!;
    expect(Math.abs(Number(timestamp) - Date.now() / 1000)).toBeLessThan(5);
    const expected = createHmac("sha256", SECRET).update(`${timestamp}.${String(call.init.body)}`).digest("hex");
    expect(header(call, "x-purge-signature")).toBe(expected);
    expect(call.init.signal).toBeInstanceOf(AbortSignal);
  });

  test("skips and warns once when either env var is missing", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    delete process.env.V2_SITE_URL;
    expect(await purgeCdnTags(["products"])).toBe(false);
    process.env.V2_SITE_URL = SITE;
    delete process.env.CACHE_PURGE_SECRET;
    expect(await purgeCdnTags(["products"])).toBe(false);
    expect(calls).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("swallows a non-2xx answer and logs without the secret", async () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    respond = async () => Response.json({ ok: false }, { status: 401 });
    expect(await purgeCdnTags(["products"])).toBe(false);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toBe("[cache] CDN purge failed");
    expect(JSON.stringify(error.mock.calls)).not.toContain(SECRET);
  });

  test("swallows a network error or timeout", async () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    respond = async () => Promise.reject(new Error("The operation timed out."));
    expect(await purgeCdnTags(["products"])).toBe(false);
    expect(error.mock.calls[0]?.[0]).toBe("[cache] CDN purge failed");
  });
});

describe("productPurgeTags", () => {
  test("product:{handle} + products for a plain handle, else products", () => {
    expect(productPurgeTags("wave-pack")).toEqual(["product:wave-pack", "products"]);
    expect(productPurgeTags(undefined)).toEqual(["products"]);
    expect(productPurgeTags("Not A Handle")).toEqual(["products"]);
  });
});

describe("busts purge the matching tags", () => {
  beforeEach(() => {
    spyOn(console, "warn").mockImplementation(() => {});
    spyOn(console, "info").mockImplementation(() => {});
  });

  test("bustProductCache with and without a handle", async () => {
    await bustProductCache("wave-pack");
    await bustProductCache();
    expect(calls.map(tagsOf)).toEqual([["product:wave-pack", "products"], ["products"]]);
  });

  test("bustCompositionsCache and bustFreeResourcesCache", async () => {
    await bustCompositionsCache();
    await bustFreeResourcesCache();
    expect(calls.map(tagsOf)).toEqual([["compositions"], ["free-resources"]]);
  });

  test("a failed purge never makes the bust throw", async () => {
    spyOn(console, "error").mockImplementation(() => {});
    respond = async () => Promise.reject(new Error("boom"));
    await expect(bustProductCache("wave-pack")).resolves.toBeUndefined();
    await expect(bustCompositionsCache()).resolves.toBeUndefined();
    await expect(bustFreeResourcesCache()).resolves.toBeUndefined();
  });
});
