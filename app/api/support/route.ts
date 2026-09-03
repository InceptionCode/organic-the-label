import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { SupportPayloadSchema } from "@/lib/validation/support"
import {
  syncContactToSupabase,
  syncContactToMailerLite,
  logContactEvent,
} from "@/lib/email/sync-contact"
import {
  sendSupportConfirmationEmail,
  sendSupportNotificationEmail,
} from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = SupportPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      )
    }

    const { name, email, category, subject, message, marketingOptIn } = parsed.data

    const supabase = createSupabaseAdminClient()

    const { data: supportRequest, error } = await supabase
      .from("support_requests")
      .insert({
        name,
        email: email.toLowerCase(),
        category,
        subject: subject ?? null,
        message,
        status: "open",
      })
      .select("id")
      .single()

    if (error || !supportRequest) {
      console.error("[/api/support] insert error", error)
      return NextResponse.json({ ok: false, error: "Failed to save request." }, { status: 500 })
    }

    await Promise.allSettled([
      sendSupportConfirmationEmail({
        to: email,
        name,
        supportRequestId: supportRequest.id,
      }),
      sendSupportNotificationEmail({
        supportRequestId: supportRequest.id,
        name,
        email,
        category,
        subject,
        message,
      }),
    ])

    if (marketingOptIn) {
      const contact = await syncContactToSupabase({
        email,
        firstName: name.split(" ")[0],
        source: "website",
        signupSource: "support_form",
        tags: ["newsletter"],
      })

      await syncContactToMailerLite({
        email,
        firstName: name.split(" ")[0],
        supabaseContactId: contact.id,
        source: "website",
        signupSource: "support_form",
        groupIds: [process.env.MAILERLITE_GROUP_NEWSLETTER_ID!],
        fields: { signup_source: "support_form" },
      })

      await logContactEvent({
        contactId: contact.id,
        eventType: "support_request_created",
        metadata: { support_request_id: supportRequest.id, category },
      })
    }

    return NextResponse.json({ ok: true, id: supportRequest.id })
  } catch (err) {
    console.error("[/api/support]", err)
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 })
  }
}
