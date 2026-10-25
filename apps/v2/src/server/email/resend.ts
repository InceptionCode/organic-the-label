import { env } from '~/server/env'

export type SendEmailInput = {
  from: string
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string | string[]
}

export class EmailError extends Error {
  readonly status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'EmailError'
    this.status = status
  }
}

export function createResendClient(apiKey: string | undefined) {
  async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new EmailError(`Resend responded with HTTP ${res.status}`, res.status)
    return (await res.json()) as { id: string }
  }

  return { sendEmail }
}

export const { sendEmail } = createResendClient(env.RESEND_API_KEY)
