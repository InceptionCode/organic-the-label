import type { SupabaseClient } from '@supabase/supabase-js'
import { CAPTCHA_FAILED_MESSAGE, verifyCaptcha as defaultVerifyCaptcha, type CaptchaResult } from '~/server/captcha/verify'
import { logContactEvent, storeMailerLiteId, syncContact } from '~/server/email/contacts'
import { buildFreeResourceEmail } from '~/server/email/free-resource-email'
import { upsertSubscriber as defaultUpsertSubscriber, type UpsertSubscriberInput } from '~/server/email/mailerlite'
import { sendEmail as defaultSendEmail, type SendEmailInput } from '~/server/email/resend'
import { env } from '~/server/env'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { DEFAULT_FREE_RESOURCE_SLUG } from './get'
import { FREE_REQUEST_MESSAGES, type FreeResourceRequest, type FreeResourceRequestResult } from './request-schema'

const TAG = '[freeResources.request]'

export type FreeRequestConfig = {
  siteUrl: string
  from: string | undefined
  replyTo: string | undefined
  leadsGroupId: string | undefined
  starterKitGroupId: string | undefined
  newsletterGroupId: string | undefined
}

export type FreeRequestDeps = {
  client?: SupabaseClient
  verifyCaptcha?: (token: string, remoteIp?: string | null) => Promise<CaptchaResult>
  /** Lazy anonymous identity, supplied by the adapter (it owns the cookies). Never fatal. */
  ensureVisitor?: () => Promise<unknown>
  upsertSubscriber?: (input: UpsertSubscriberInput) => Promise<{ id: string }>
  sendEmail?: (input: SendEmailInput) => Promise<{ id: string }>
  config?: Partial<FreeRequestConfig>
  remoteIp?: string | null
  /** Signed-in requester: linked on the contact; no visitor is created. */
  userId?: string
}

export type FreeRequestOutcome = { status: number; result: FreeResourceRequestResult }

function defaultConfig(): FreeRequestConfig {
  return {
    siteUrl: env.SITE_URL,
    from: env.EMAIL_FROM_DOWNLOADS,
    replyTo: env.EMAIL_FROM_SUPPORT,
    leadsGroupId: env.MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID,
    starterKitGroupId: env.MAILERLITE_GROUP_DOWNLOADED_STARTER_KIT_ID,
    newsletterGroupId: env.MAILERLITE_GROUP_NEWSLETTER_ID,
  }
}

const fail = (status: number, error: string): FreeRequestOutcome => ({ status, result: { ok: false, error } })
const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * The free resource request flow (pages/free.md, steps 1 to 10), with v1 semantics except where the
 * spec decided otherwise: the captcha is verified before any write, MailerLite is non-fatal, and
 * `resource_email_sent` is logged only when the email actually went out.
 */
export async function requestFreeResource(input: FreeResourceRequest, deps: FreeRequestDeps = {}): Promise<FreeRequestOutcome> {
  // 1. hCaptcha, before anything is written.
  if (!input.captchaToken) return fail(400, FREE_REQUEST_MESSAGES.captchaMissing)
  const captcha = await (deps.verifyCaptcha ?? defaultVerifyCaptcha)(input.captchaToken, deps.remoteIp)
  if (!captcha.ok) return fail(captcha.reason === 'missing-token' ? 400 : 403, captcha.reason === 'missing-token' ? FREE_REQUEST_MESSAGES.captchaMissing : CAPTCHA_FAILED_MESSAGE)

  // 2. Lazy visitor for anonymous requesters.
  if (!deps.userId && deps.ensureVisitor) {
    await deps.ensureVisitor().catch((error: unknown) => console.error(TAG, 'ensureVisitor failed', message(error)))
  }

  const config = { ...defaultConfig(), ...deps.config }
  const client = deps.client ?? createSupabaseAdminClient()
  const slug = input.resourceSlug

  // 3. The active resource (download_url stays on the server).
  const { data: resourceRow, error: resourceError } = await client
    .from('free_resources')
    .select('id, name, download_url, mailerlite_group_id')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (resourceError) console.error(TAG, 'resource lookup failed', resourceError.message)
  const resource = resourceRow as { id: string; name: string; download_url: string; mailerlite_group_id: string | null } | null
  if (!resource) return fail(404, FREE_REQUEST_MESSAGES.notFound)

  // 4. Contact plus tags.
  const tags = ['free_resource', `downloaded_${slug.replace(/-/g, '_')}`]
  if (input.marketingOptIn) tags.push('newsletter')
  const contact = await syncContact(client, {
    email: input.email,
    firstName: input.firstName,
    source: 'website',
    signupSource: 'free_resource',
    tags,
    userId: deps.userId,
  })

  // 5. MailerLite groups. Non-fatal (decided 2026-10-18): log and carry on.
  const resourceGroupId = resource.mailerlite_group_id ?? (slug === DEFAULT_FREE_RESOURCE_SLUG ? config.starterKitGroupId : undefined)
  const groups = [config.leadsGroupId, resourceGroupId, input.marketingOptIn ? config.newsletterGroupId : undefined].filter(
    (g): g is string => Boolean(g),
  )
  if (!config.leadsGroupId) console.error(TAG, 'MAILERLITE_GROUP_FREE_RESOURCE_LEADS_ID is not set')
  try {
    const subscriber = await (deps.upsertSubscriber ?? defaultUpsertSubscriber)({
      email: input.email,
      groups,
      fields: {
        name: input.firstName ?? null,
        signup_source: 'free_resource',
        supabase_contact_id: contact.id,
        last_resource_downloaded: slug,
      },
    })
    if (subscriber.id) await storeMailerLiteId(client, contact.id, subscriber.id)
  } catch (error) {
    console.error(TAG, 'MailerLite sync failed (non-fatal)', message(error))
  }

  // 6. The tracked download row.
  const { data: downloadRow, error: downloadError } = await client
    .from('resource_downloads')
    .insert({ contact_id: contact.id, resource_id: resource.id })
    .select('id')
    .single()
  if (downloadError) console.error(TAG, 'resource_downloads insert failed', downloadError.message)
  const downloadId = (downloadRow as { id: string } | null)?.id

  // 7. The emailed link: the tracked route, or the raw URL if the insert failed (v1).
  const downloadUrl = downloadId ? `${config.siteUrl}/free/download/${downloadId}` : resource.download_url

  // 8. Send, settled. email_sent_at only on success.
  let emailSent = false
  try {
    if (!config.from) throw new Error('EMAIL_FROM_DOWNLOADS is not set')
    const email = buildFreeResourceEmail({ firstName: input.firstName, resourceName: resource.name, downloadUrl })
    await (deps.sendEmail ?? defaultSendEmail)({ from: config.from, to: input.email, replyTo: config.replyTo, ...email })
    emailSent = true
  } catch (error) {
    console.error(TAG, 'email send failed', message(error))
  }
  if (downloadId && emailSent) {
    const { error } = await client.from('resource_downloads').update({ email_sent_at: new Date().toISOString() }).eq('id', downloadId)
    if (error) console.error(TAG, 'email_sent_at update failed', error.message)
  }

  // 9. Contact bookkeeping and events.
  const { error: lastError } = await client.from('email_contacts').update({ last_resource_downloaded: slug }).eq('id', contact.id)
  if (lastError) console.error(TAG, 'last_resource_downloaded update failed', lastError.message)
  await logContactEvent(client, {
    contactId: contact.id,
    eventType: 'resource_requested',
    metadata: { resource_slug: slug, resource_id: resource.id },
  })
  if (emailSent) {
    await logContactEvent(client, { contactId: contact.id, eventType: 'resource_email_sent', provider: 'resend', metadata: { resource_slug: slug } })
  }

  // 10.
  return { status: 200, result: { ok: true } }
}
