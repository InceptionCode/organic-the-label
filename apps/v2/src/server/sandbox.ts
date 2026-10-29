// E2E email sandbox (phase 07.4, owner decision 2026-10-29). With E2E_SANDBOX=true on a
// non-production runtime, the Resend and MailerLite clients record their calls here instead of
// sending, and the non-auth hCaptcha verifier accepts hCaptcha's documented test token. Playwright
// starts its own dev server with the flag (port 3101) and reads the log from GET /api/__sandbox.
//
// It can never be on in production: env.ts calls assertSandboxAllowed() when the server boots and
// throws if the flag is set while NODE_ENV or VERCEL_ENV says production, and isSandboxed() repeats
// the production check on every call. No env.ts import here (env.ts imports this module).

type EnvLike = Record<string, string | undefined>

/** hCaptcha's documented test response token (docs.hcaptcha.com, "Integration Testing: Test Keys"). */
export const HCAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'

/** Oldest entries are dropped past this, so a long-running sandbox server never grows without bound. */
export const SANDBOX_LOG_LIMIT = 500

export function isProductionRuntime(source: EnvLike = process.env): boolean {
  return source.NODE_ENV === 'production' || source.VERCEL_ENV === 'production'
}

const requested = (source: EnvLike) => source.E2E_SANDBOX === 'true'

/** Throws when E2E_SANDBOX=true on a production runtime. Called by env.ts at boot. */
export function assertSandboxAllowed(source: EnvLike = process.env): void {
  if (requested(source) && isProductionRuntime(source)) {
    throw new Error('E2E_SANDBOX=true is not allowed in production. Remove it from this environment.')
  }
}

/** True only when the flag is set AND the runtime is not production. */
export function isSandboxed(source: EnvLike = process.env): boolean {
  return requested(source) && !isProductionRuntime(source)
}

export type SandboxCall = {
  /** Increasing per server process; tests read entries after a known seq. */
  seq: number
  at: string
  service: 'resend' | 'mailerlite'
  action: 'send' | 'upsert' | 'unsubscribe'
  payload: Record<string, unknown>
}

// On globalThis so every module instance in the dev server (SSR, server fns, server routes) shares it.
const STORE = Symbol.for('organic.v2.e2eSandboxLog')
type Store = { seq: number; calls: SandboxCall[] }
const store = (): Store => {
  const g = globalThis as unknown as Record<symbol, Store | undefined>
  g[STORE] ??= { seq: 0, calls: [] }
  return g[STORE]
}

export function recordSandboxCall(service: SandboxCall['service'], action: SandboxCall['action'], payload: Record<string, unknown>): SandboxCall {
  const s = store()
  const call: SandboxCall = { seq: ++s.seq, at: new Date().toISOString(), service, action, payload }
  s.calls.push(call)
  if (s.calls.length > SANDBOX_LOG_LIMIT) s.calls.splice(0, s.calls.length - SANDBOX_LOG_LIMIT)
  return call
}

export function readSandboxLog(): SandboxCall[] {
  return [...store().calls]
}

/** Test helper: empties the log (unit tests only; the route never clears it). */
export function resetSandboxLog(): void {
  const s = store()
  s.calls = []
  s.seq = 0
}

/** GET /api/__sandbox. 404 unless sandboxed, so the route is inert everywhere else. */
export function handleSandboxRequest(source: EnvLike = process.env): Response {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  if (!isSandboxed(source)) return Response.json({ ok: false, error: 'Not found.' }, { status: 404, headers })
  return Response.json({ ok: true, calls: readSandboxLog() }, { headers })
}
