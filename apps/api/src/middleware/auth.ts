import { timingSafeEqual } from "crypto";

export function verifySharedSecret(header: string | null, envVar: string): boolean {
  const secret = process.env[envVar];
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[auth] ${envVar} is not set in production, refusing request`);
      return false;
    }
    console.warn(`[auth] ${envVar} not set, allowing through (non-production only)`);
    return true;
  }
  if (!header) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(header));
  } catch {
    return false;
  }
}
