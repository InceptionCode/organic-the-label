import { NextResponse } from "next/server"
import { SubscribePayloadSchema } from "@/lib/validation/email"
import {
  syncContactToSupabase,
  syncContactToMailerLite,
  logContactEvent,
} from "@/lib/email/sync-contact"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = SubscribePayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      )
    }

    const { email, firstName, source, marketingOptIn } = parsed.data

    if (!marketingOptIn) {
      return NextResponse.json(
        { ok: false, error: "Marketing consent is required to subscribe." },
        { status: 400 }
      )
    }

    const contact = await syncContactToSupabase({
      email,
      firstName,
      source: source ?? "website",
      signupSource: source ?? "footer",
      tags: ["newsletter"],
    })

    await syncContactToMailerLite({
      email,
      firstName,
      supabaseContactId: contact.id,
      source: source ?? "website",
      signupSource: source ?? "footer",
      groupIds: [process.env.MAILERLITE_GROUP_NEWSLETTER_ID!],
      fields: { signup_source: source ?? "footer" },
    })

    await logContactEvent({
      contactId: contact.id,
      eventType: "subscribed",
      provider: "mailerlite",
      metadata: { source, signup_source: source },
    })

    await logContactEvent({
      contactId: contact.id,
      eventType: "mailerlite_synced",
      provider: "mailerlite",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/email/subscribe]", err)
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 })
  }
}
