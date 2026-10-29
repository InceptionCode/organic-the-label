import { env } from '~/server/env'

// Server-side hCaptcha check for forms that do not go through Supabase Auth (contact, free resource
// request, newsletter). Supabase verifies its own auth forms; never call this for those.

export type CaptchaResult = { ok: true } | { ok: false; reason: 'missing-token' | 'not-configured' | 'rejected' | 'unavailable' }

type SiteverifyResponse = { success: boolean; 'error-codes'?: string[] }

export function createCaptchaVerifier(secret: string | undefined, fetchImpl: typeof fetch = fetch) {
  return async function verifyCaptcha(token: string | null | undefined, remoteIp?: string | null): Promise<CaptchaResult> {
    if (!token) return { ok: false, reason: 'missing-token' }
    if (!secret) {
      console.error('[captcha] HCAPTCHA_SECRET_KEY is not set')
      return { ok: false, reason: 'not-configured' }
    }
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)
    try {
      const res = await fetchImpl('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) {
        console.error('[captcha] siteverify responded with HTTP', res.status)
        return { ok: false, reason: 'unavailable' }
      }
      const data = (await res.json()) as SiteverifyResponse
      if (data.success) return { ok: true }
      console.warn('[captcha] rejected', data['error-codes']?.join(',') ?? '')
      return { ok: false, reason: 'rejected' }
    } catch (error) {
      console.error('[captcha] siteverify failed', error instanceof Error ? error.message : error)
      return { ok: false, reason: 'unavailable' }
    }
  }
}

export const verifyCaptcha = createCaptchaVerifier(env.HCAPTCHA_SECRET_KEY)

/** User-facing copy shared by every form that verifies a captcha token. */
export const CAPTCHA_FAILED_MESSAGE = 'CAPTCHA verification failed. Please try again.'
