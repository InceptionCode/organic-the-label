/**
 * Flow G — Support Status Update Webhook
 *
 * Triggered by a Supabase Database Webhook on the support_requests table
 * (UPDATE events only).
 *
 * Supabase webhook config:
 *   Table:   public.support_requests
 *   Events:  UPDATE
 *   URL:     https://organicsonics.com/api/webhooks/support-status
 *   Headers: { "x-webhook-secret": "<SUPABASE_SUPPORT_WEBHOOK_SECRET>" }
 *
 * Supabase does not HMAC-sign webhook payloads (unlike MailerLite), so we
 * use a shared-secret header instead.  Set the same value in:
 *   - Supabase webhook custom header
 *   - SUPABASE_SUPPORT_WEBHOOK_SECRET env var (both dev + prod + Vercel)
 */

import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { sendSupportStatusEmail } from "@/lib/email/resend"

// Statuses that trigger a customer email.
const EMAILABLE_STATUSES = new Set(["pending", "closed"])

// Supabase Database Webhook payload shape for UPDATE events.
type SupportRequestRecord = {
  id: string
  name: string | null
  email: string
  status: string
  resolution_note: string | null
}

type WebhookPayload = {
  type: "UPDATE"
  table: string
  schema: string
  record: SupportRequestRecord
  old_record: SupportRequestRecord
}

function verifySecret(header: string | null): boolean {
  const secret = process.env.SUPABASE_SUPPORT_WEBHOOK_SECRET
  // If no secret is configured, allow through (dev convenience — lock down in prod)
  if (!secret) return true
  if (!header) return false

  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(header))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret")

  if (!verifySecret(secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const { record, old_record } = payload

  // Ignore if status didn't change — Supabase fires on ANY column update
  if (record.status === old_record.status) {
    return NextResponse.json({ ok: true, skipped: "status_unchanged" })
  }

  // Only email on actionable statuses
  if (!EMAILABLE_STATUSES.has(record.status)) {
    return NextResponse.json({ ok: true, skipped: `status_not_emailable:${record.status}` })
  }

  const status = record.status as "pending" | "closed"
  const name = record.name ?? "there"
  const email = record.email

  await sendSupportStatusEmail({
    to: email,
    name,
    status,
    resolutionNote: record.resolution_note,
    supportRequestId: record.id,
  })

  // Log the event to email_contact_events if there's a linked contact
  try {
    const supabase = createSupabaseAdminClient()
    const { data: contact } = await supabase
      .from("email_contacts")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

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
      })
    }
  } catch (err) {
    // Non-fatal — logging failure must not block the response
    console.warn("[/api/webhooks/support-status] event log failed:", err)
  }

  return NextResponse.json({ ok: true, emailed: email, status })
}
