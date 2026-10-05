import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "../lib/supabase.ts";

type MailerLiteWebhookEvent = {
  events: {
    type: string;
    occurred_at: string;
    data: {
      subscriber: { id: string; email: string; status: string };
    };
  }[];
};

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.MAILERLITE_WEBHOOK_SECRET;
  if (!secret) return true;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const STATUS_MAP: Record<string, string> = {
  "subscriber.unsubscribed": "unsubscribed",
  "subscriber.bounced": "bounced",
  "subscriber.spam_reported": "complained",
};

const app = new Hono();

app.post("/mailerlite", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-mailerlite-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return c.json({ ok: false }, 401);
  }

  let payload: MailerLiteWebhookEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ ok: false }, 400);
  }

  const supabase = createSupabaseAdminClient();

  for (const event of payload.events ?? []) {
    const { type, data } = event;
    const email = data?.subscriber?.email?.toLowerCase();
    if (!email) continue;

    const newStatus = STATUS_MAP[type];
    if (!newStatus) continue;

    const { data: contact } = await supabase
      .from("email_contacts")
      .select("id")
      .eq("email", email)
      .single();

    if (!contact) continue;

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "unsubscribed") updatePayload.unsubscribed_at = new Date().toISOString();
    if (newStatus === "bounced") updatePayload.bounced_at = new Date().toISOString();
    if (newStatus === "complained") updatePayload.complained_at = new Date().toISOString();

    await supabase.from("email_contacts").update(updatePayload).eq("id", contact.id);

    await supabase.from("email_contact_events").insert({
      contact_id: contact.id,
      event_type: `mailerlite_${newStatus}`,
      provider: "mailerlite",
      provider_event_id: data.subscriber.id,
      metadata: { type, email },
    });
  }

  return c.json({ ok: true });
});

export { app as mailerliteRoute };
