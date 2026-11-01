import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, setResponseStatus } from '@tanstack/react-start/server'
import { createSupportRequest } from '~/server/support/create-support-request'
import { SUPPORT_MESSAGES, SupportPayloadSchema, type SupportResult } from '~/server/support/schema'

function clientIp(): string | undefined {
  const forwarded = getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || getRequestHeader('x-real-ip') || undefined
}

/** /contact and the Work With Me inquiry (category work_with_me) both submit through this fn. */
export const submitSupportRequestFn = createServerFn({ method: 'POST' })
  .validator(SupportPayloadSchema)
  .handler(async ({ data }): Promise<SupportResult> => {
    try {
      const outcome = await createSupportRequest(data, { clientIp: clientIp() })
      if (outcome.ok) return outcome
      setResponseStatus(outcome.status)
      return { ok: false, error: outcome.error }
    } catch (error) {
      console.error('[support.submit]', error instanceof Error ? error.message : error)
      setResponseStatus(500)
      return { ok: false, error: SUPPORT_MESSAGES.generic }
    }
  })
