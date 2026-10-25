import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { getCookie, setResponseStatus } from '@tanstack/react-start/server'
import type { AuthError, User } from '@supabase/supabase-js'
import {
  confirmSearchSchema,
  magicLinkSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '~/lib/auth-schemas'
import { mapUser } from '~/lib/map-user'
import { safeNext } from '~/lib/safe-next'
import { env } from '~/server/env'
import { bootstrapUser } from '~/server/identity/bootstrap'
import { ANON_COOKIE } from '~/server/identity/visitor'
import { createSupabasePublicClient, createSupabaseServerClient } from '~/server/supabase/server'
import { tanstackCookieAdapter } from './cookies'
import { requireUser } from './middleware/require-user'

const confirmUrl = () => `${env.SITE_URL}/auth/confirm`

type AuthResult = { ok: true } | { ok: false; error: string }

function authFailure(scope: string, error: AuthError, fallback: string): AuthResult {
  console.error(`[auth.${scope}]`, error.code ?? error.status, error.message)
  if (error.code === 'captcha_failed') return { ok: false, error: 'CAPTCHA verification failed. Please try again.' }
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    return { ok: false, error: 'Too many requests. Please wait a moment and try again.' }
  }
  return { ok: false, error: fallback }
}

// Errors here never block sign-in; the merge is idempotent and reruns on the next sign-in.
async function bootstrapSafely(user: User) {
  try {
    const session = mapUser(user)
    if (!session) return
    await bootstrapUser({
      userId: user.id,
      email: user.email ?? null,
      emailVerified: !!user.email_confirmed_at,
      displayName: session.displayName,
      anonToken: getCookie(ANON_COOKIE),
    })
  } catch (error) {
    console.error('[auth.bootstrap]', error instanceof Error ? error.message : error)
  }
}

export const signInWithPasswordFn = createServerFn({ method: 'POST' })
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient(tanstackCookieAdapter())
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
      options: { captchaToken: data.captchaToken },
    })
    if (error || !result.user) {
      if (error?.code === 'email_not_confirmed') {
        return { ok: false as const, error: 'Please confirm your email first. Check your inbox for the link.' }
      }
      const failure = error ? authFailure('signIn', error, 'Invalid email or password.') : null
      return { ok: false as const, error: failure && !failure.ok ? failure.error : 'Invalid email or password.' }
    }
    await bootstrapSafely(result.user)
    return { ok: true as const, user: mapUser(result.user) }
  })

export const sendMagicLinkFn = createServerFn({ method: 'POST' })
  .validator(magicLinkSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const { error } = await createSupabasePublicClient().auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: confirmUrl(), captchaToken: data.captchaToken },
    })
    if (error) return authFailure('magicLink', error, 'We could not send the link. Please try again.')
    return { ok: true }
  })

export const signUpFn = createServerFn({ method: 'POST' })
  .validator(signUpSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const { error } = await createSupabasePublicClient().auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { username: data.username }, emailRedirectTo: confirmUrl(), captchaToken: data.captchaToken },
    })
    if (error) {
      const weak = error.code === 'weak_password' ? error.message : 'We could not create your account. Please try again.'
      return authFailure('signUp', error, weak)
    }
    return { ok: true }
  })

// Same response whether or not the email has an account.
export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .validator(resetRequestSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const { error } = await createSupabasePublicClient().auth.resetPasswordForEmail(data.email, {
      redirectTo: confirmUrl(),
      captchaToken: data.captchaToken,
    })
    if (error) {
      const result = authFailure('resetRequest', error, '')
      if (!result.ok && result.error) return result
    }
    return { ok: true }
  })

export const updatePasswordFn = createServerFn({ method: 'POST' })
  .middleware([requireUser])
  .validator(updatePasswordSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const supabase = createSupabaseServerClient(tanstackCookieAdapter())
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      const message = error.code === 'same_password' || error.code === 'weak_password' ? error.message : ''
      return authFailure('updatePassword', error, message || 'We could not update your password. Please try again.')
    }
    await supabase.auth.signOut()
    return { ok: true }
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { error } = await createSupabaseServerClient(tanstackCookieAdapter()).auth.signOut()
  if (error) console.error('[auth.signOut]', error.message)
  return { ok: true as const }
})

// Verifies the email link on the cookie client, merges the visitor, then redirects.
export const confirmOtpFn = createServerFn({ method: 'POST' })
  .validator(confirmSearchSchema)
  .handler(async ({ data }) => {
    if (!data.token_hash || !data.type) {
      setResponseStatus(400)
      return { ok: false as const }
    }
    const supabase = createSupabaseServerClient(tanstackCookieAdapter())
    const { data: result, error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: data.type })
    if (error || !result.user) {
      if (error) console.error('[auth.confirm]', error.code ?? error.status, error.message)
      setResponseStatus(400)
      return { ok: false as const }
    }
    await bootstrapSafely(result.user)
    throw redirect({ href: safeNext(data.next) })
  })
