import type { SupabaseClient } from '@supabase/supabase-js'
import { logContactEvent } from '~/server/email/contacts'
import { DOWNLOAD_HEADERS, jsonError } from '~/server/downloads/http'
import { createSupabaseAdminClient } from '~/server/supabase/admin'

// GET /free/download/$id (pages/free.md). The id is the resource_downloads row created by a request
// and emailed to the requester; it is the capability. No row, an inactive resource, or a malformed
// id is a 404. The resource's download_url is only ever sent as this 302's Location.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NOT_FOUND = 'Download not found.'
const TAG = '[freeResources.download]'

type DownloadRow = {
  id: string
  contact_id: string
  downloaded_at: string | null
  free_resources: { slug: string; download_url: string; active: boolean } | null
}

export type ResolvedDownload = { found: false } | { found: true; url: string }

export async function resolveFreeDownload(id: string, client: SupabaseClient = createSupabaseAdminClient()): Promise<ResolvedDownload> {
  if (!UUID_PATTERN.test(id)) return { found: false }

  const { data, error } = await client
    .from('resource_downloads')
    .select('id, contact_id, downloaded_at, free_resources ( slug, download_url, active )')
    .eq('id', id)
    .maybeSingle()
  const row = data as DownloadRow | null
  const resource = row?.free_resources
  if (error) console.error(TAG, 'lookup failed', error.message)
  if (error || !row || !resource?.active || !resource.download_url) return { found: false }

  if (!row.downloaded_at) {
    // Conditional update: only the first hit stamps downloaded_at, so the event is logged once even
    // when two clicks race.
    const { data: stamped, error: updateError } = await client
      .from('resource_downloads')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('downloaded_at', null)
      .select('id')
    if (updateError) {
      console.error(TAG, 'recording the download failed (non-fatal)', updateError.message)
    } else if (Array.isArray(stamped) ? stamped.length > 0 : Boolean(stamped)) {
      await logContactEvent(client, {
        contactId: row.contact_id,
        eventType: 'resource_downloaded',
        metadata: { resource_slug: resource.slug, resource_download_id: row.id },
      })
    }
  }

  return { found: true, url: resource.download_url }
}

export async function handleFreeDownload(id: string, client?: SupabaseClient): Promise<Response> {
  const resolved = await resolveFreeDownload(id, client)
  if (!resolved.found) return jsonError(404, NOT_FOUND)
  return new Response(null, { status: 302, headers: { ...DOWNLOAD_HEADERS, Location: resolved.url } })
}
