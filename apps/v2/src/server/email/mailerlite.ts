import { env } from '~/server/env'
import { EmailError } from './resend'

export type UpsertSubscriberInput = {
  email: string
  groups: string[]
  fields?: Record<string, string | number | null>
}

export function createMailerLiteClient(apiKey: string | undefined) {
  // MailerLite's POST /subscribers creates or updates by email, so it is an upsert.
  async function upsertSubscriber(input: UpsertSubscriberInput): Promise<{ id: string }> {
    if (!apiKey) throw new Error('MAILERLITE_API_KEY is not set')

    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        groups: input.groups,
        ...(input.fields ? { fields: input.fields } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new EmailError(`MailerLite responded with HTTP ${res.status}`, res.status)
    const body = (await res.json()) as { data: { id: string } }
    return { id: body.data.id }
  }

  return { upsertSubscriber }
}

export const { upsertSubscriber } = createMailerLiteClient(env.MAILERLITE_API_KEY)
