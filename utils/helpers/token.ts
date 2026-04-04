import { RECOVERY_COOKIE_NAME } from "@/lib/constants";
import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(24).toString("hex");
}

export function queryRecoveryToken(
  sp: Record<string, string | string[] | undefined>
): string | undefined {
  const raw = sp[RECOVERY_COOKIE_NAME]
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw[0]) return raw[0]
  return undefined
}
