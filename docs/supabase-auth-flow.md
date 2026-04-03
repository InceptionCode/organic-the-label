# Supabase Auth Flow

This app uses Supabase Auth for sign-in, sign-up, magic links (OTP via token_hash), and password resets. After authentication, the app bootstraps the user in the database and merges any anonymous activity.

---

## Email Template Architecture

**This project uses the custom token_hash email template approach, not PKCE code exchange.**

Supabase email templates must be configured to link directly to `/api/auth/confirm` with the `token_hash` embedded. Without this, all email-based auth (confirmation, magic link, password reset) will fail silently.

### Required Email Template URLs

Set these in **Supabase Dashboard → Authentication → Email Templates**:

| Template | URL in "Confirmation URL" field |
|---|---|
| Confirm signup | `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account` |
| Magic Link | `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/explore` |
| Reset Password | `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/login/reset-password` |

### Required Redirect URL Allowlist

Set in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

```
http://localhost:3000/**
https://your-dev-domain.vercel.app/**
https://yourproductiondomain.com/**
```

---

## Common Concepts

- **hCaptcha** is required on: signup, magic link request, forgot password request. It is NOT required on: sign-in, password update (reset confirm), or account updates.
- **Redirect URLs** are driven by `NEXT_PUBLIC_SITE_URL` in `emailRedirectTo`/`redirectTo` fields. These act as hints for Supabase default templates but are secondary when using custom templates.
- **Session bootstrapping** runs after every successful authentication. It upserts `profiles`, ensures `user_preferences`, and merges anonymous visitor activity and unclaimed entitlements into the authenticated user.
- **Anonymous visitors** are tracked before sign-in via an `anon_token` cookie set by `POST /api/auth/init`.
- **`createSupabasePublicClient`** (anon key, no cookies) must be used for fire-and-forget email send operations. `createSupabaseAdminClient` (service role) must never be used for user-facing auth — it bypasses captcha verification.

---

## Supabase Client Reference

| Client | File | Key Used | When to Use |
|---|---|---|---|
| `createSupabaseBrowserClient` | `utils/supabase/client-base.ts` | Anon key | Client components, browser-side auth actions |
| `createSupabaseServerClient` | `utils/supabase/server-base.ts` | Anon key + cookies | Server actions/routes that read/write session |
| `createSupabasePublicClient` | `utils/supabase/base.ts` | Anon key, no cookies | Server actions that fire email (no session needed) |
| `createSupabaseAdminClient` | `utils/supabase/base.ts` | Service role | Internal data ops only — never user-facing auth |

---

## 1) Email + Password Sign-In

**Route:** `GET /login`  
**Action:** `app/api/auth/auth-actions.ts` → `signinAction` (`'use client'`)

1. User submits login form on `/login`.
2. `signinAction` runs browser-side, calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success: `POST /api/auth/bootstrap` is called. Bootstrap upserts `profiles`, ensures `user_preferences`, and merges anonymous activity into the authenticated user.
4. UI redirects to `/explore`.
5. `AuthStoreProvider.onAuthStateChange` fires `SIGNED_IN` → Zustand store updates.

**No hCaptcha on sign-in.** Rate limiting is handled at the Supabase level.

---

## 2) Sign Up

**Route:** `GET /signup`  
**Action:** `app/api/auth/auth-actions.ts` → `signupAction` (`'use client'`)

1. User submits signup form on `/signup`.
2. `signupAction` runs browser-side with hCaptcha token.
3. Calls `supabase.auth.signUp({ email, password, options: { data: { username, type: 'email' }, captchaToken, emailRedirectTo: SITE_URL/api/auth/confirm?next=/account } })`.
4. On success: redirect to `/account`. The `confirmed_at` field is empty — account shows "please confirm your email" banner.

**[Email confirmation]**

5. User clicks link in confirmation email.
6. Email template links to: `/api/auth/confirm?token_hash=XXX&type=email&next=/account`
7. `GET /api/auth/confirm` calls `supabase.auth.verifyOtp({ type: 'email', token_hash })`.
8. Calls `bootstrapAuthenticatedUser` — upserts profile, ensures preferences, merges anon visitor.
9. Redirects to `/account`. The `confirmed_at` is now set — banner disappears.

---

## 3) Magic Link Sign-In

**Route:** Dialog on `GET /login`  
**Action:** `app/api/auth/magic-link-action.ts` (`'use server'`)

1. User opens "Sign in with magic link" dialog and submits email.
2. `magicLinkAction` uses `createSupabasePublicClient` (anon key — required for hCaptcha verification).
3. Calls `supabase.auth.signInWithOtp({ email, options: { captchaToken, emailRedirectTo: SITE_URL/api/auth/confirm?next=/explore } })`.
4. UI shows "Check your email for the magic link."

**[After email click]**

5. Email template links to: `/api/auth/confirm?token_hash=XXX&type=magiclink&next=/explore`
6. `GET /api/auth/confirm` calls `supabase.auth.verifyOtp({ type: 'magiclink', token_hash })` → establishes session in SSR cookies.
7. Calls `bootstrapAuthenticatedUser` — upserts profile, ensures preferences, merges anon activity.
8. Redirects to `/explore`.
9. `AuthStoreProvider.onAuthStateChange` fires `SIGNED_IN` → Zustand store updates.

---

## 4) Forgot Password — Request

**Route:** Dialog on `GET /login`  
**Action:** `app/api/auth/reset-password-request.ts` (`'use server'`)

1. User opens "Forgot password?" dialog and submits email.
2. `resetPasswordRequest` uses `createSupabasePublicClient` (anon key — required for hCaptcha verification).
3. Calls `supabase.auth.resetPasswordForEmail(email, { captchaToken, redirectTo: SITE_URL/api/auth/confirm?next=/login/reset-password })`.
4. UI shows "Check your email for reset instructions."

**[After email click]**

5. Email template links to: `/api/auth/confirm?token_hash=XXX&type=recovery&next=/login/reset-password`
6. `GET /api/auth/confirm` calls `supabase.auth.verifyOtp({ type: 'recovery', token_hash })` → establishes recovery session in SSR cookies.
7. Calls `bootstrapAuthenticatedUser` (idempotent upsert — harmless for existing users).
8. Redirects to `/login/reset-password`.

---

## 5) Forgot Password — Set New Password

**Route:** `GET /login/reset-password`  
**Action:** `app/api/auth/reset-user-password.ts` (`'use server'`)  
**Component:** `app/login/components/reset-password-form.tsx`

1. User arrives at `/login/reset-password` with active recovery session in cookies (set by step 4 above).
2. Form shows: password + confirm password fields. **No captcha — not required here.**
3. User submits form → `resetUserPasswordAction` server action.
4. Uses `createSupabaseServerClient` (reads recovery session from request cookies).
5. Calls `supabase.auth.updateUser({ password })`.
6. On success: `router.replace('/login')`.
7. User signs in with their new password.

**Important:** `supabase.auth.updateUser()` does not accept a `captchaToken`. Never add captcha to this step.

---

## 6) Sign Out

**Hook:** `utils/hooks/use-sign-out.ts`  
**Action:** `app/api/auth/auth-actions.ts` → `signOutAction` (`'use client'`)

1. User triggers sign-out (button, nav link, etc.).
2. `signOutAction` runs browser-side, calls `supabase.auth.signOut()`.
3. On success: `router.push('/')`.
4. `AuthStoreProvider.onAuthStateChange` fires `SIGNED_OUT` → Zustand store clears user.

---

## 7) Auth State (Client UI)

**Provider:** `store/auth-context.tsx` → `AuthStoreProvider`  
**Placed in:** `app/layout.tsx`

The `AuthStoreProvider` creates a browser Supabase client and subscribes to `onAuthStateChange`. When any auth event fires (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED), it maps the Supabase user to the app's `User` schema and updates the Zustand store. All client components that need the current user call `useUser()` or `useAuthStore(selector)`.

---

## 8) Session Refresh (Middleware)

**File:** `proxy.ts` (root) → calls `updateSession` from `utils/supabase/middleware.ts`

This project uses Next.js 16's `proxy.ts` as the middleware entrypoint. Runs on every non-static request. Uses `createServerClient` with the **anon key** (not service role). Calls `supabase.auth.getUser()` to validate and refresh the session token, writing updated cookies to the response.

**Must use anon key.** Using service role in middleware is a security vulnerability — it bypasses RLS on every request.

---

## 9) Anonymous Visitor Flow

1. On first visit, client calls `POST /api/auth/init`.
2. Init route creates or retrieves an anonymous visitor record and sets an `anon_token` cookie.
3. Activity events are tracked against the anonymous visitor ID until sign-in.
4. On sign-in/signup confirmation, `bootstrapAuthenticatedUser` → `mergeAnonymousVisitorIntoUser` reads the `anon_token` cookie, reassigns activity events, claims unclaimed entitlements, and marks the visitor as claimed.

---

## Route Reference

| Route | File | Purpose |
|---|---|---|
| `GET /login` | `app/login/page.tsx` | Login form + magic link dialog + forgot password dialog |
| `GET /login/reset-password` | `app/login/reset-password/page.tsx` | Set new password (after recovery email) |
| `GET /signup` | `app/signup/page.tsx` | Sign up form |
| `GET /account` | `app/account/page.tsx` | Account page (shows unverified banner) |
| `GET /api/auth/confirm` | `app/api/auth/confirm/route.ts` | Verify token_hash OTP; redirect after verification |
| `POST /api/auth/bootstrap` | `app/api/auth/bootstrap/route.ts` | Upsert profile + merge anon visitor |
| `POST /api/auth/init` | `app/api/auth/init/route.ts` | Create/update anonymous visitor |
