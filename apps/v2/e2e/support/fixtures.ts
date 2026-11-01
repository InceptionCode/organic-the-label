import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
import { deleteContacts, deleteVisitor, generateTokenHash } from './admin'
import { E2E_USER_EMAIL, IS_LOCAL_SANDBOX } from './env'
import { stubHCaptcha } from './hcaptcha-stub'

export type SandboxCall = {
  seq: number
  at: string
  service: 'resend' | 'mailerlite'
  action: 'send' | 'upsert' | 'unsubscribe'
  payload: Record<string, unknown>
}

export class Sandbox {
  constructor(private readonly request: APIRequestContext) {}

  async calls(): Promise<SandboxCall[]> {
    const res = await this.request.get('/api/__sandbox')
    expect(res.status(), 'the E2E server must run with E2E_SANDBOX=true').toBe(200)
    return ((await res.json()) as { calls: SandboxCall[] }).calls
  }

  /** The highest seq so far; later calls are the ones this test caused. */
  async mark(): Promise<number> {
    const calls = await this.calls()
    return calls.at(-1)?.seq ?? 0
  }

  async since(mark: number, match: (call: SandboxCall) => boolean = () => true): Promise<SandboxCall[]> {
    return (await this.calls()).filter((c) => c.seq > mark && match(c))
  }

  /** Polls until at least `count` matching calls exist after `mark`. */
  async waitFor(mark: number, match: (call: SandboxCall) => boolean, count = 1): Promise<SandboxCall[]> {
    let found: SandboxCall[] = []
    await expect
      .poll(async () => {
        found = await this.since(mark, match)
        return found.length
      }, { timeout: 20_000 })
      .toBeGreaterThanOrEqual(count)
    return found
  }
}

/** Calls for one address (Resend `to` or MailerLite `email`). */
export const forEmail = (email: string) => (call: SandboxCall) => {
  const p = call.payload
  const to = Array.isArray(p.to) ? p.to : [p.to]
  return p.email === email || to.includes(email)
}

type Fixtures = {
  sandbox: Sandbox
  /** Addresses registered here are deleted (contact, tags, events, downloads) after the test. */
  cleanupEmails: string[]
  /** Signs the dedicated test user in through a magic link (no email sent). */
  signIn: (page?: Page) => Promise<void>
  _visitorCleanup: void
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, provide) => {
    await stubHCaptcha(page)
    await provide(page)
  },

  sandbox: async ({ request }, provide, testInfo) => {
    testInfo.skip(!IS_LOCAL_SANDBOX, 'Needs the sandboxed dev server (no E2E_BASE_URL)')
    await provide(new Sandbox(request))
  },

  cleanupEmails: async ({}, provide) => {
    const emails: string[] = []
    await provide(emails)
    await deleteContacts(emails)
  },

  signIn: async ({ page }, provide, testInfo) => {
    testInfo.skip(!IS_LOCAL_SANDBOX, 'Signs in against the dev Supabase project; local server only')
    await provide(async (target = page) => {
      const hash = await generateTokenHash('magiclink')
      await target.goto(`/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink`)
      await expect(target).toHaveURL(/\/explore$/)
    })
  },

  // Every anonymous visitor a test's browser created is removed afterwards (activity rows cascade).
  _visitorCleanup: [
    async ({ context }, provide) => {
      await provide()
      if (!IS_LOCAL_SANDBOX) return
      const cookies = await context.cookies()
      const anon = cookies.find((c) => c.name === 'anon_token')?.value
      if (anon) await deleteVisitor(decodeURIComponent(anon))
    },
    { auto: true },
  ],
})

export { expect, E2E_USER_EMAIL }

/** Waits until the client has hydrated (the root layout marks <html data-hydrated>). */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true', null, { timeout: 30_000 })
}

/**
 * The server fn a request calls, e.g. 'signInWithPasswordFn', or null. Dev-server ids are base64url
 * JSON naming the export (`getCartFn_createServerFn_handler`); a production build hashes them, so
 * specs that rely on this run against the local dev server only.
 */
export function serverFnName(url: string): string | null {
  const id = /\/_serverFn\/([^/?#]+)/.exec(url)?.[1]
  if (!id) return null
  try {
    const decoded = JSON.parse(Buffer.from(id, 'base64url').toString('utf8')) as { export?: string }
    return decoded.export?.replace(/_createServerFn_handler$/, '') ?? null
  } catch {
    return null
  }
}
