import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/utils/supabase/base"
import { logContactEvent } from "@/lib/email/sync-contact"

const TAG = "[/api/resources/download]"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type DownloadRow = {
  id: string
  contact_id: string
  downloaded_at: string | null
  free_resources: { slug: string; download_url: string; active: boolean } | null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ ok: false, error: "Download not found." }, { status: 404 })
  }

  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from("resource_downloads")
    .select("id, contact_id, downloaded_at, free_resources ( slug, download_url, active )")
    .eq("id", id)
    .maybeSingle()

  const row = data as DownloadRow | null
  const resource = row?.free_resources

  if (error || !row || !resource?.active) {
    console.error(`${TAG} not found`, { id, error: error?.message })
    return NextResponse.json({ ok: false, error: "Download not found." }, { status: 404 })
  }

  if (!row.downloaded_at) {
    const { error: updateError } = await supabase
      .from("resource_downloads")
      .update({ downloaded_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("downloaded_at", null)

    if (updateError) {
      console.error(`${TAG} failed to record download (non-fatal)`, updateError.message)
    } else {
      await logContactEvent({
        contactId: row.contact_id,
        eventType: "resource_downloaded",
        metadata: { resource_slug: resource.slug, resource_download_id: row.id },
      })
    }
  }

  return NextResponse.redirect(resource.download_url, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  })
}
