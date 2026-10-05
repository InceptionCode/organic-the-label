import { Hono } from "hono";
import { timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "../lib/supabase.ts";
import { sendSupportStatusEmail } from "../lib/email/resend.ts";

const EMAILABLE_STATUSES = new Set(["pending", "closed"]);

type SupportRequestRecord = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  resolution_note: string | null;
};

type WebhookPayload = {
  type: "UPDATE";
  table: string;
  schema: string;
  record: SupportRequestRecord;
  old_record: SupportRequestRecord;
};

function verifySecret(header: string | null): boolean {
  const secret = process.env.SUPABASE_SUPPORT_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!header) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(header));
  } catch {
    return false;
  }
}

const app = new Hono();

app.post("/support-status", async (c) => {
  if (!verifySecret(c.req.header("x-webhook-secret") ?? null)) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { record, old_record } = payload;

  if (record.status === old_record.status) {
    return c.json({ ok: true, skipped: "status_unchanged" });
  }

  if (!EMAILABLE_STATUSES.has(record.status)) {
    return c.json({ ok: true, skipped: `status_not_emailable:${record.status}` });
  }

  const status = record.status as "pending" | "closed";

  await sendSupportStatusEmail({
    to: record.email,
    name: record.name ?? "there",
    status,
    resolutionNote: record.resolution_note,
    supportRequestId: record.id,
  });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: contact } = await supabase
      .from("email_contacts")
      .select("id")
      .eq("email", record.email.toLowerCase())
      .single();

    if (contact) {
      await supabase.from("email_contact_events").insert({
        contact_id: contact.id,
        event_type: `support_status_${status}`,
        provider: "resend",
        metadata: {
          support_request_id: record.id,
          old_status: old_record.status,
          new_status: status,
        },
      });
    }
  } catch (err) {
    console.warn("[/webhooks/support-status] event log failed:", err);
  }

  return c.json({ ok: true, emailed: record.email, status });
});

export { app as supportStatusRoute };
