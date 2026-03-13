import { randomBytes } from "crypto";

export function generateAnonToken(): string {
  return randomBytes(24).toString("hex");
}