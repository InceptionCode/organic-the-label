import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader, setCookie, setResponseStatus } from '@tanstack/react-start/server'
import { subscribeToNewsletter } from '~/server/email/subscribe'
import {
  isHoneypotTripped,
  SUBSCRIBE_MESSAGES,
  SubscribePayloadSchema,
  type SubscribeResult,
} from '~/server/email/subscribe-schema'
import { env } from '~/server/env'
import { ensureVisitor } from '~/server/identity/visitor'
import { supabaseSession } from './middleware/session'

export const subscribeFn = createServerFn({ method: 'POST' })
  .middleware([supabaseSession])
  .validator(SubscribePayloadSchema)
  .handler(async ({ data: { company, ...data }, context }): Promise<SubscribeResult> => {
    // Bots get the same success the form shows, before any visitor row or write.
    if (isHoneypotTripped({ company })) return { ok: true }
    if (!data.marketingOptIn) {
      setResponseStatus(400)
      return { ok: false, error: SUBSCRIBE_MESSAGES.consentRequired }
    }
    const userId = context.claims?.sub
    try {
      // Signed-in users are not visitors. Anonymous subscribers get a visitor lazily so a later
      // sign-up merges their history (00-architecture section 6, rule 5). Never fatal.
      if (!userId) {
        await ensureVisitor({
          getCookie,
          setCookie,
          userAgent: getRequestHeader('user-agent'),
          secure: !env.SITE_URL.startsWith('http://localhost'),
        }).catch((error: unknown) => console.error('[newsletter.ensureVisitor]', error instanceof Error ? error.message : error))
      }
      return await subscribeToNewsletter({ ...data, userId })
    } catch (error) {
      console.error('[newsletter.subscribe]', error instanceof Error ? error.message : error)
      setResponseStatus(500)
      return { ok: false, error: SUBSCRIBE_MESSAGES.generic }
    }
  })
