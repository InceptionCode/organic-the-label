import { timingSafeEqual } from "crypto";

export function verifySharedSecret(header: string | null, envVar: string): boolean {
  const secret = process.env[envVar];
  if (!secret) return true; // dev convenience — lock down in prod
  if (!header) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(header));
  } catch {
    return false;
  }
}
