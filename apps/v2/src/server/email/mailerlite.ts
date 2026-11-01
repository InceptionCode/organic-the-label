import { env } from '~/server/env'
import { isSandboxed, recordSandboxCall } from '~/server/sandbox'
import { EmailError, type EmailClientOptions } from './resend'

export type UpsertSubscriberInput = {
  email: string
  groups: string[]
  fields?: Record<string, string | number | null>
  /**
   * Reactivates a subscriber who unsubscribed earlier. MailerLite documents `resubscribe: true` on
   * POST /api/subscribers for this ("resubscribe previously unsubscribed subscribers"); without it a
   * returning person is added to the group but stays unsubscribed.
   */
  resubscribe?: boolean
}

// https://developers.mailerlite.com/docs/subscribers.html ("Create/upsert subscriber").
const SUBSCRIBERS_URL = 'https://connect.mailerlite.com/api/subscribers'

export function createMailerLiteClient(apiKey: string | undefined, { sandboxed = isSandboxed }: EmailClientOptions = {}) {
  async function postSubscriber(body: Record<string, unknown>): Promise<{ id: string }> {
    if (sandboxed()) {
      const call = recordSandboxCall('mailerlite', body.status === 'unsubscribed' ? 'unsubscribe' : 'upsert', body)
      return { id: `sandbox_${call.seq}` }
    }
    if (!apiKey) throw new Error('MAILERLITE_API_KEY is not set')

    const res = await fetch(SUBSCRIBERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new EmailError(`MailerLite responded with HTTP ${res.status}`, res.status)
    const json = (await res.json()) as { data: { id: string } }
    return { id: json.data.id }
  }

  // MailerLite's POST /subscribers creates or updates by email, so it is an upsert.
  function upsertSubscriber(input: UpsertSubscriberInput): Promise<{ id: string }> {
    return postSubscriber({
      email: input.email,
      groups: input.groups,
      ...(input.fields ? { fields: input.fields } : {}),
      ...(input.resubscribe ? { resubscribe: true } : {}),
    })
  }

  // The same upsert with `status: 'unsubscribed'` (the documented way; there is no separate
  // unsubscribe endpoint). An unsubscribed subscriber gets no marketing sends from any group.
  async function unsubscribeSubscriber(email: string): Promise<void> {
    await postSubscriber({ email, status: 'unsubscribed' })
  }

  return { upsertSubscriber, unsubscribeSubscriber }
}

export const { upsertSubscriber, unsubscribeSubscriber } = createMailerLiteClient(env.MAILERLITE_API_KEY)
