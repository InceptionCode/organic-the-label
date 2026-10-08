import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import { mapSupabaseUser } from '~/lib/supabase/map-user'
import { ensureAnonymousVisitor } from '~/lib/supabase/ensure-anon-visitor'
import { mergeAnonymousVisitorIntoUser } from '~/lib/supabase/migrate-anon-user'
import type { User } from '~/lib/supabase/map-user'

const ANON_COOKIE_NAME = 'anon_token'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Returns the current authenticated user (not anon) or null.
export const getUserFn = createServerFn({ method: 'GET' }).handler(async (): Promise<User | null> => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return mapSupabaseUser(user)
})

// Boots an anonymous Supabase session if none exists, then upserts the
// anonymous_visitors row and sets the anon_token cookie.
// Called from the root route beforeLoad so every page load is covered.
export const ensureAnonVisitorFn = createServerFn({ method: 'GET' }).handler(async (): Promise<User | null> => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) return null
  }

  // Track in anonymous_visitors table for activity attribution
  let anonToken = getCookie(ANON_COOKIE_NAME)
  if (!anonToken) {
    anonToken = crypto.randomUUID().replace(/-/g, '')
    setCookie(ANON_COOKIE_NAME, anonToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ANON_COOKIE_MAX_AGE,
    })
  }

  try {
    await ensureAnonymousVisitor(anonToken)
  } catch (e) {
    console.error('[ensureAnonVisitorFn] ensureAnonymousVisitor failed:', e)
  }

  const { data: { user: finalUser } } = await supabase.auth.getUser()
  if (!finalUser) return null
  return mapSupabaseUser(finalUser)
})

// Sends a magic link to the given email address.
export const sendMagicLinkFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3001'
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// Confirms an OTP token hash (from magic link email).
// After confirmation, migrates any anonymous activity to the newly authenticated user.
export const confirmOtpFn = createServerFn({ method: 'POST' })
  .validator(z.object({ token_hash: z.string(), type: z.string() }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: data.type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
    })
    if (error) throw new Error(error.message)

    const user = authData.user
    if (user) {
      try {
        await mergeAnonymousVisitorIntoUser({
          userId: user.id,
          email: user.email,
          emailVerified: !!user.email_confirmed_at,
        })
      } catch (e) {
        console.error('[confirmOtpFn] mergeAnonymousVisitorIntoUser failed:', e)
      }
    }

    return { ok: true }
  })

// Signs the user out and clears their Supabase session cookies.
export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  return { ok: true }
})

// Requests a password reset email.
export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3001'
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// Updates the authenticated user's password (called after clicking reset link).
export const updatePasswordFn = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().min(8) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// Signs in with email + password.
// Migrates any anonymous activity to the now-authenticated user after sign in.
export const signInWithPasswordFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }): Promise<User> => {
    const supabase = createSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)

    const user = authData.user
    try {
      await mergeAnonymousVisitorIntoUser({
        userId: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
      })
    } catch (e) {
      console.error('[signInWithPasswordFn] mergeAnonymousVisitorIntoUser failed:', e)
    }

    const mapped = mapSupabaseUser(user)
    if (!mapped) throw new Error('Failed to map authenticated user')
    return mapped
  })

// Creates a new account with email + password.
// Supabase sends a confirmation email; the user is not fully authenticated
// until they confirm. After confirmation, confirmOtpFn handles the migration.
export const signUpWithPasswordFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), password: z.string().min(8) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3001'
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })
