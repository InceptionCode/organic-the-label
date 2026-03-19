# Supabase Auth Flow

This app uses Supabase Auth for sign-in, sign-up, magic links (OTP), and password resets. After authentication, the app bootstraps the user in the database and merges any anonymous activity.

## Common concepts

- HCaptcha: the magic link, password reset, and sign-up flows require a `captchaToken` from `HCaptchaField`.
- Redirect URLs are driven by `NEXT_PUBLIC_SITE_URL` (used for `emailRedirectTo` / `redirectTo` when Supabase emails links).
- Session bootstrapping: password sign-in calls `POST /api/auth/bootstrap`, which reads the current logged-in user via `supabase.auth.getUser()`, upserts `profiles` and ensures `user_preferences`, and merges anonymous visitor activity into the authenticated user (guest entitlements).

## 1) Email + password sign-in

1. User submits the login form on `/login`.
2. Client calls the server action `signinAction`, which uses `supabase.auth.signInWithPassword({ email, password })`.
3. On success, the login page calls `POST /api/auth/bootstrap` to upsert/merge the user.
4. The UI redirects the user to `/explore`.

## 2) Sign up

1. User submits the sign-up form on `/signup`.
2. `signupAction` calls `supabase.auth.signUp({ email, password, options: { data: { username, type: 'email' }, captchaToken } })`.
3. On success, the UI redirects to `/account`.
4. `/account` checks whether `confirmed_at` is empty and prompts the user to confirm their email.

## 3) Magic link sign-in (OTP)

1. User opens the 'sign in with magic link' dialog and submits their email.
2. `magicLinkAction` calls `supabase.auth.signInWithOtp({ email, options: { captchaToken, emailRedirectTo } })`.
3. Supabase emails a magic link containing OTP parameters (notably `token_hash` and `type`).
4. The callback is handled by `GET /api/auth/confirm`, which verifies the OTP with `supabase.auth.verifyOtp({ type, token_hash })`, calls `bootstrapAuthenticatedUser(...)` to upsert `profiles` / initialize `user_preferences` / merge anonymous activity, and then redirects to the `next` query param (defaulting to `/explore`).

## 4) Password reset

1. User submits the reset form in the 'Forgot Password?' dialog.
2. `resetPasswordRequest` calls `supabase.auth.resetPasswordForEmail(email, { captchaToken, redirectTo: /login })`.
3. Supabase emails reset instructions.
4. After the password is reset, the user returns to `/login` (via Supabase's `redirectTo` behavior).

