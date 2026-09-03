import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { ResourceRequestPayloadSchema } from "@/lib/validation/email"
import {
  syncContactToSupabase,
  syncContactToMailerLite,
  logContactEvent,
} from "@/lib/email/sync-contact"
import { sendFreeResourceEmail } from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ResourceRequestPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      )
    }

    const { email, firstName, resourceSlug, marketingOptIn } = parsed.data

    const supabase = createSupabaseAdminClient()

    const { data: resource, error: resourceError } = await supabase
      .from("free_resources")
      .select("id, name, download_url")
      .eq("slug", resourceSlug)
      .eq("active", true)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json(
        { ok: false, error: "Resource not found." },
        { status: 404 }
      )
    }

    const tags = ["free_resource", `downloaded_${resourceSlug.replace(/-/g, "_")}`]
    if (marketingOptIn) tags.push("newsletter")

    const contact = await syncContactToSupabase({
      email,
      firstName,
      source: "website",
      signupSource: "free_resource",
      tags,
    })

    const groupIds = [
      process.env.MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID!,
      process.env.MAILERLITE_GROUP_DOWNLOADED_STARTER_KIT_ID!,
    ]
    if (marketingOptIn) groupIds.push(process.env.MAILERLITE_GROUP_NEWSLETTER_ID!)

    await syncContactToMailerLite({
      email,
      firstName,
      supabaseContactId: contact.id,
      source: "website",
      signupSource: "free_resource",
      groupIds,
      fields: {
        last_resource_downloaded: resourceSlug,
        signup_source: "free_resource",
      },
    })

    const { data: downloadRecord } = await supabase
      .from("resource_downloads")
      .insert({
        contact_id: contact.id,
        resource_id: resource.id,
      })
      .select("id")
      .single()

    await sendFreeResourceEmail({
      to: email,
      firstName,
      resourceName: resource.name,
      downloadUrl: resource.download_url,
    })

    if (downloadRecord?.id) {
      await supabase
        .from("resource_downloads")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", downloadRecord.id)
    }

    await supabase
      .from("email_contacts")
      .update({ last_resource_downloaded: resourceSlug })
      .eq("id", contact.id)

    await logContactEvent({
      contactId: contact.id,
      eventType: "resource_requested",
      metadata: { resource_slug: resourceSlug, resource_id: resource.id },
    })

    await logContactEvent({
      contactId: contact.id,
      eventType: "resource_email_sent",
      provider: "resend",
      metadata: { resource_slug: resourceSlug },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/resources/request]", err)
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 })
  }
}
