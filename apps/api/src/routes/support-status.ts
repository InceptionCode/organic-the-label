import { Hono } from "hono";
import { createSupabaseAdminClient } from "../lib/supabase.ts";
import { sendSupportStatusEmail } from "../lib/email/resend.ts";
import { verifySharedSecret } from "../middleware/auth.ts";
import { supportWebhookSchema, type SupportWebhookPayload } from "../schemas/index.ts";

const EMAILABLE_STATUSES = new Set(["pending", "closed"]);

const app = new Hono();

app.post("/support-status", async (c) => {
  if (!verifySharedSecret(c.req.header("x-webhook-secret") ?? null, "SUPABASE_SUPPORT_WEBHOOK_SECRET")) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  let payload: SupportWebhookPayload;
  try {
    payload = supportWebhookSchema.parse(await c.req.json());
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

  try {
    await sendSupportStatusEmail({
      to: record.email,
      name: record.name ?? "there",
      status,
      resolutionNote: record.resolution_note,
      supportRequestId: record.id,
    });
  } catch (err) {
    console.error("[/webhooks/support-status] email send failed", {
      supportRequestId: record.id,
      status,
      err,
    });
    return c.json({ ok: false, error: "Email send failed" }, 500);
  }

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
