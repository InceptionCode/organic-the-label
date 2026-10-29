import type { SupabaseClient } from '@supabase/supabase-js'
import { verifyCaptcha as defaultVerifyCaptcha, CAPTCHA_FAILED_MESSAGE, type CaptchaResult } from '~/server/captcha/verify'
import { logContactEvent, storeMailerLiteId, syncContact } from '~/server/email/contacts'
import { upsertSubscriber as defaultUpsert, type UpsertSubscriberInput } from '~/server/email/mailerlite'
import { sendEmail as defaultSendEmail, type SendEmailInput } from '~/server/email/resend'
import { buildSupportConfirmationEmail, buildSupportNotificationEmail } from '~/server/email/support-emails'
import { env } from '~/server/env'
import { createSupabaseAdminClient } from '~/server/supabase/admin'
import { SUPPORT_MESSAGES, type ParsedSupportPayload } from './schema'

export type SupportDeps = {
  client?: SupabaseClient
  verifyCaptcha?: (token: string, remoteIp?: string | null) => Promise<CaptchaResult>
  sendEmail?: (input: SendEmailInput) => Promise<{ id: string }>
  upsertSubscriber?: (input: UpsertSubscriberInput) => Promise<{ id: string }>
  newsletterGroupId?: string | undefined
  emailFrom?: string | undefined
  forwardTo?: string | undefined
  logger?: Pick<Console, 'error' | 'warn'>
}

/** `status` is the HTTP status the adapter sets for a failure. */
export type CreateSupportOutcome = { ok: true; id: string } | { ok: false; status: 400 | 500; error: string }

const pick = <K extends keyof SupportDeps>(deps: SupportDeps, key: K, fallback: SupportDeps[K]) =>
  key in deps ? deps[key] : fallback


export async function createSupportRequest(
  input: ParsedSupportPayload,
  { clientIp }: { clientIp?: string | null } = {},
  deps: SupportDeps = {},
): Promise<CreateSupportOutcome> {
  const logger = deps.logger ?? console
  const verify = deps.verifyCaptcha ?? defaultVerifyCaptcha

  const captcha = await verify(input.captchaToken, clientIp)
  if (!captcha.ok) return { ok: false, status: 400, error: CAPTCHA_FAILED_MESSAGE }

  const client = deps.client ?? createSupabaseAdminClient()
  const email = input.email.toLowerCase()

  const { data, error } = await client
    .from('support_requests')
    .insert({
      name: input.name,
      email,
      category: input.category,
      subject: input.subject ?? null,
      message: input.message,
      status: 'open',
    })
    .select('id')
    .single()
  const id = (data as { id?: string } | null)?.id
  if (error || !id) {
    logger.error('[support] insert failed:', error?.message ?? 'no row')
    return { ok: false, status: 500, error: SUPPORT_MESSAGES.saveFailed }
  }

  await sendEmails(id, input, deps, logger)

  if (input.marketingOptIn) {
    try {
      await syncOptIn(id, input, client, deps)
    } catch (optInError) {
      logger.error('[support] newsletter opt-in sync failed:', optInError instanceof Error ? optInError.message : optInError)
    }
  }

  return { ok: true, id }
}

async function sendEmails(id: string, input: ParsedSupportPayload, deps: SupportDeps, logger: Pick<Console, 'error' | 'warn'>) {
  const send = deps.sendEmail ?? defaultSendEmail
  const from = pick(deps, 'emailFrom', env.EMAIL_FROM_SUPPORT)
  const forwardTo = pick(deps, 'forwardTo', env.SUPPORT_FORWARD_EMAIL)
  if (!from) {
    logger.error('[support] EMAIL_FROM_SUPPORT is not set; no emails sent for', id)
    return
  }

  const jobs: Promise<unknown>[] = [send(buildSupportConfirmationEmail({ to: input.email, name: input.name, supportRequestId: id }, from))]
  if (forwardTo) {
    jobs.push(
      send(
        buildSupportNotificationEmail(
          { supportRequestId: id, name: input.name, email: input.email, category: input.category, subject: input.subject, message: input.message },
          { from, forwardTo },
        ),
      ),
    )
  } else {
    logger.error('[support] SUPPORT_FORWARD_EMAIL is not set; notification skipped for', id)
  }

  const results = await Promise.allSettled(jobs)
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const which = i === 0 ? 'confirmation' : 'notification'
      logger.error(`[support] ${which} email failed:`, result.reason instanceof Error ? result.reason.message : result.reason)
    }
  })
}

async function syncOptIn(id: string, input: ParsedSupportPayload, client: SupabaseClient, deps: SupportDeps) {
  const groupId = pick(deps, 'newsletterGroupId', env.MAILERLITE_GROUP_NEWSLETTER_ID)
  if (!groupId) throw new Error('MAILERLITE_GROUP_NEWSLETTER_ID is not set')
  const upsert = deps.upsertSubscriber ?? defaultUpsert
  const firstName = input.name.split(' ')[0] || undefined

  const contact = await syncContact(client, {
    email: input.email,
    firstName,
    source: 'website',
    signupSource: 'support_form',
    tags: ['newsletter'],
  })
  const subscriber = await upsert({
    email: input.email,
    groups: [groupId],
    fields: { name: firstName ?? null, signup_source: 'support_form', supabase_contact_id: contact.id },
  })
  if (subscriber.id) await storeMailerLiteId(client, contact.id, subscriber.id)
  await logContactEvent(client, {
    contactId: contact.id,
    eventType: 'support_request_created',
    metadata: { support_request_id: id, category: input.category },
  })
}
