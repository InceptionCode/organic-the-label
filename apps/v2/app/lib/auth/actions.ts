import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import { mapSupabaseUser } from '~/lib/supabase/map-user'
import { ensureAnonymousVisitor } from '~/lib/supabase/ensure-anon-visitor'
import { bootstrapAuthenticatedUser } from '~/lib/supabase/bootstrap-user'
import type { User } from '~/lib/supabase/map-user'

const ANON_COOKIE_NAME = 'anon_token'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Password must be at least 8 chars, contain an uppercase letter and a number.
// Matches v1 SigninFormSchema / SignupFormSchema validation rules.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .refine(
    (pw) => /^(?=.*[A-Z])(?=.*[0-9]).+$/.test(pw),
    'Password must contain a capital letter and a number.',
  )

// Returns the current authenticated (non-anon) user, or null.
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

// Sends a magic link OTP email.
// Accepts an optional captchaToken (hCaptcha) for abuse protection on the form.
export const sendMagicLinkFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), captchaToken: z.string().optional() }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3001'
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        captchaToken: data.captchaToken,
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/explore`,
      },
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// Verifies an OTP token hash (magic link or email confirmation).
// Bootstraps profiles/user_preferences and merges anon activity.
// Redirect to `next` is handled by the calling route, not this function.
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
      const displayName =
        (user.user_metadata?.username as string | undefined) ??
        (user.user_metadata?.display_name as string | undefined) ??
        null
      try {
        await bootstrapAuthenticatedUser({
          userId: user.id,
          email: user.email,
          emailVerified: !!(user.email_confirmed_at ?? user.confirmed_at),
          displayName,
        })
      } catch (e) {
        console.error('[confirmOtpFn] bootstrapAuthenticatedUser failed:', e)
      }
    }

    return { ok: true }
  })

// Signs in with email + password.
// Bootstraps profiles/user_preferences and merges anon activity after sign-in.
export const signInWithPasswordFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), password: passwordSchema }))
  .handler(async ({ data }): Promise<User> => {
    const supabase = createSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)

    const user = authData.user
    const displayName =
      (user.user_metadata?.username as string | undefined) ??
      (user.user_metadata?.display_name as string | undefined) ??
      null

    try {
      await bootstrapAuthenticatedUser({
        userId: user.id,
        email: user.email,
        emailVerified: !!(user.email_confirmed_at ?? user.confirmed_at),
        displayName,
      })
    } catch (e) {
      console.error('[signInWithPasswordFn] bootstrapAuthenticatedUser failed:', e)
    }

    const mapped = mapSupabaseUser(user)
    if (!mapped) throw new Error('Failed to map authenticated user')
    return mapped
  })

// Creates a new account with email, username, and password.
// Supabase sends a confirmation email; bootstrapAuthenticatedUser fires
// via confirmOtpFn after the user clicks the link.
export const signUpWithPasswordFn = createServerFn({ method: 'POST' })
  .validator(
    z
      .object({
        email: z.string().email(),
        username: z
          .string()
          .trim()
          .refine(
            (u) => /^[a-zA-Z0-9._-]+$/.test(u),
            'Username must not contain special characters.',
          ),
        password: passwordSchema,
        confirmPassword: passwordSchema,
        captchaToken: z.string().min(1, 'Please complete the CAPTCHA'),
      })
      .superRefine(({ password, confirmPassword }, ctx) => {
        if (password !== confirmPassword) {
          ctx.addIssue({
            code: 'custom',
            message: 'Passwords do not match.',
            path: ['confirmPassword'],
          })
        }
      }),
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3001'
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { username: data.username, type: 'email' },
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/account`,
        captchaToken: data.captchaToken,
      },
    })
    if (error) throw new Error(error.message)
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

// Updates the authenticated user's password (called after clicking a reset link).
export const updatePasswordFn = createServerFn({ method: 'POST' })
  .validator(z.object({ password: passwordSchema, confirmPassword: passwordSchema }).superRefine(
    ({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({ code: 'custom', message: 'Passwords do not match.', path: ['confirmPassword'] })
      }
    },
  ))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) throw new Error(error.message)
    return { ok: true }
  })
