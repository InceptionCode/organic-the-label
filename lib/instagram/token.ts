import { createSupabaseAdminClient } from "@/utils/supabase/base";

const TAG = "[instagram/token]";
const PROVIDER = "instagram";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const WARN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type TokenRow = { access_token: string; expires_at: string | null };

async function readRow(): Promise<TokenRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("access_token, expires_at")
      .eq("provider", PROVIDER)
      .maybeSingle();
    if (error) {
      console.warn(`${TAG} oauth_tokens read failed — using env fallback`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`${TAG} oauth_tokens read threw — using env fallback`, err);
    return null;
  }
}

export async function getInstagramToken(): Promise<string | null> {
  const row = await readRow();
  if (row?.access_token) {
    if (row.expires_at && Date.parse(row.expires_at) - Date.now() < WARN_WINDOW_MS) {
      console.warn(`${TAG} token expires soon`, { expiresAt: row.expires_at });
    }
    return row.access_token;
  }
  const env = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!env) console.warn(`${TAG} no DB row and no INSTAGRAM_ACCESS_TOKEN`);
  return env ?? null;
}

async function upsert(accessToken: string, expiresInSec: number | null) {
  const supabase = createSupabaseAdminClient();
  const expiresAt = expiresInSec
    ? new Date(Date.now() + expiresInSec * 1000).toISOString()
    : null;
  const { error } = await supabase
    .from("oauth_tokens")
    .upsert(
      { provider: PROVIDER, access_token: accessToken, expires_at: expiresAt, updated_at: new Date().toISOString() },
      { onConflict: "provider" },
    );
  if (error) throw new Error(`oauth_tokens upsert failed: ${error.message}`);
  return expiresAt;
}

export async function seedInstagramTokenFromEnv(): Promise<{ ok: boolean; error?: string }> {
  const env = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!env) return { ok: false, error: "INSTAGRAM_ACCESS_TOKEN not set" };
  try {
    await upsert(env, 60 * 24 * 60 * 60);
    console.info(`${TAG} seeded oauth_tokens row from env`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function refreshInstagramToken(): Promise<{
  ok: boolean;
  expiresAt?: string | null;
  error?: string;
}> {
  const current = await getInstagramToken();
  if (!current) return { ok: false, error: "no current token" };

  console.info(`${TAG} requesting refresh`);
  try {
    const res = await fetch(`${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${current}`);
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: { message: string };
    };

    if (!res.ok || json.error || !json.access_token) {
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      console.error(`${TAG} refresh failed`, msg);
      return { ok: false, error: msg };
    }

    const expiresAt = await upsert(json.access_token, json.expires_in ?? null);
    console.info(`${TAG} refreshed`, { expiresAt });
    return { ok: true, expiresAt };
  } catch (err) {
    console.error(`${TAG} refresh threw`, err);
    return { ok: false, error: String(err) };
  }
}
