import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { upsertMailerLiteSubscriber } from "@/lib/email/mailerlite"

export type SyncContactInput = {
  email: string
  firstName?: string
  source?: string
  signupSource?: string
  groupIds?: string[]
  tags?: string[]
  fields?: Record<string, string | number | boolean | null>
}

export type ContactRecord = {
  id: string
  mailerlite_subscriber_id: string | null
}

export type ContactEventInput = {
  contactId: string
  eventType: string
  provider?: string
  providerEventId?: string
  metadata?: Record<string, unknown>
}

export async function syncContactToSupabase(
  input: SyncContactInput
): Promise<ContactRecord> {
  const supabase = createSupabaseAdminClient()

  const { data: contact, error } = await supabase
    .from("email_contacts")
    .upsert(
      {
        email: input.email.toLowerCase(),
        first_name: input.firstName ?? null,
        status: "subscribed",
        marketing_opt_in: true,
        source: input.source ?? "website",
        signup_source: input.signupSource ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    )
    .select("id, mailerlite_subscriber_id")
    .single()

  if (error || !contact) {
    throw new Error(`Supabase upsert error: ${error?.message ?? "no data returned"}`)
  }

  if (input.tags?.length) {
    const tagRows = input.tags.map((tag) => ({
      contact_id: contact.id,
      tag,
    }))
    const { error: tagError } = await supabase
      .from("email_contact_tags")
      .upsert(tagRows, { onConflict: "contact_id,tag", ignoreDuplicates: true })

    if (tagError) {
      console.warn("[syncContactToSupabase] tag upsert warning:", tagError.message)
    }
  }

  return contact as ContactRecord
}

export async function syncContactToMailerLite(
  input: SyncContactInput & { supabaseContactId: string }
): Promise<{ id: string } | null> {
  const supabase = createSupabaseAdminClient()

  const subscriber = await upsertMailerLiteSubscriber({
    email: input.email,
    firstName: input.firstName,
    groupIds: input.groupIds,
    fields: {
      signup_source: input.signupSource ?? "",
      supabase_contact_id: input.supabaseContactId,
      ...input.fields,
    },
  })

  if (subscriber?.id) {
    const { error } = await supabase
      .from("email_contacts")
      .update({ mailerlite_subscriber_id: subscriber.id })
      .eq("id", input.supabaseContactId)

    if (error) {
      console.warn("[syncContactToMailerLite] failed to store ML id:", error.message)
    }
  }

  return subscriber
}

export async function logContactEvent(input: ContactEventInput): Promise<void> {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.from("email_contact_events").insert({
    contact_id: input.contactId,
    event_type: input.eventType,
    provider: input.provider ?? null,
    provider_event_id: input.providerEventId ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    console.warn("[logContactEvent] failed to log event:", error.message)
  }
}
