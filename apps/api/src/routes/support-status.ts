import { Hono } from "hono";
import { supportReplyEmailsCustomer } from "@organic/content-schema";
import { createSupabaseAdminClient } from "../lib/supabase.ts";
import { sendSupportStatusEmail } from "../lib/email/resend.ts";
import { verifySharedSecret } from "../middleware/auth.ts";
import { supportWebhookSchema, type SupportWebhookPayload } from "../schemas/index.ts";

const TAG = "[/webhooks/support-status]";

type EmailableStatus = "pending" | "closed";

export type SupportStatusDeps = {
  sendEmail?: typeof sendSupportStatusEmail;
  createClient?: typeof createSupabaseAdminClient;
};

/**
 * Emails the customer when the admin moves a ticket to pending or closed, or changes the note at
 * one of those statuses. The rule is `supportReplyEmailsCustomer` from @organic/content-schema, the
 * same one the admin uses to label its save button, so the two cannot disagree.
 */
export function createSupportStatusRoute({
  sendEmail = sendSupportStatusEmail,
  createClient = createSupabaseAdminClient,
}: SupportStatusDeps = {}) {
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

    if (!supportReplyEmailsCustomer(old_record, record)) {
      return c.json({ ok: true, skipped: "no_customer_email" });
    }

    const status = record.status as EmailableStatus;
    const reason = record.status !== old_record.status ? "status_changed" : "note_changed";

    try {
      await sendEmail({
        to: record.email,
        name: record.name ?? "there",
        status,
        resolutionNote: record.resolution_note,
        supportRequestId: record.id,
      });
    } catch (err) {
      console.error(`${TAG} email send failed`, { supportRequestId: record.id, status, reason, err });
      return c.json({ ok: false, error: "Email send failed" }, 500);
    }

    try {
      const supabase = createClient();
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
            reason,
          },
        });
      }
    } catch (err) {
      console.warn(`${TAG} event log failed:`, err);
    }

    return c.json({ ok: true, emailed: record.email, status, reason });
  });

  return app;
}

export const supportStatusRoute = createSupportStatusRoute();
