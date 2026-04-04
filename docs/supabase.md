# Supabase Database Setup

This doc summarizes the database schema created by your Supabase migrations (`supabase/migrations`) and the intended read/write flow enforced by Row Level Security (RLS).

Related app documentation: [`docs/supabase-auth-flow.md`](./supabase-auth-flow.md)

## Migrations

1. `20260313123723_user_systems.sql`
   - Creates core domain tables: `profiles`, `user_preferences`, `anonymous_visitors`, `activity_events`, `memberships`, `points_ledger`, `rewards`, `reward_redemptions`, `entitlements`
   - Adds helper function `public.set_updated_at()` and triggers to maintain `updated_at`
   - Adds `public.points_balance` view (sums points ledger deltas)
   - Adds auth bootstrap trigger `public.handle_new_user()` (after insert into `auth.users`) to populate `profiles` and `user_preferences`
   - Enables and configures RLS policies to support “client can read own data, server/admin performs writes”

2. `20260313203554_user_anon_system_update.sql`
   - Extends `anonymous_visitors` with `claimed_by_user_id` (FK to `public.profiles`)

## Data model (high level)

### Identity and preferences

- `public.profiles`
  - One row per authenticated user (`profiles.id` references `auth.users(id)`).
  - Stores `email`, `display_name`, and `role` (`user` or `admin`).
  - Trigger: keeps `updated_at` fresh on updates.

- `public.user_preferences`
  - One row per profile (`user_id` is both the PK and an FK to `profiles(id)`).
  - Stores favorites arrays and marketing/personalization opt-ins.
  - Trigger: keeps `updated_at` fresh on updates.

### Anonymous activity and tracking

- `public.anonymous_visitors`
  - Represents a browser/visitor identified by `anon_token`.
  - Tracks `first_seen_at` / `last_seen_at`.
  - Migration v2 adds `claimed_by_user_id` to link an anonymous visitor to a profile once claimed.

- `public.activity_events`
  - Append-only-ish event log with:
    - `user_id` (FK to `profiles(id)`) OR `anonymous_visitor_id` (FK to `anonymous_visitors(id)`)
    - `event_type` and `event_properties` (JSONB)
  - DB-level check enforces that at least one actor is present.

### Memberships, points, rewards

- `public.memberships`
  - Per-user subscription/membership records (`user_id` FK to `profiles`).
  - `status`, `tier`, `starts_at`, optional `ends_at`, and `source`.
  - Unique constraint: `(user_id, tier)` (prevents duplicate tiers per user).

- `public.points_ledger`
  - Stores incremental points changes with `points_delta`, a `reason`, and `metadata`.
  - `public.points_balance` view sums ledger deltas per `user_id` to produce a current balance.

- `public.rewards`
  - Reward catalog: `code` (unique), `title`, `points_cost`, `reward_type`, and `is_active`.

- `public.reward_redemptions`
  - Records user redemptions of rewards.
  - References `user_id` and `reward_id`.
  - `status` is constrained to `redeemed | canceled | fulfilled`.

### Entitlements (product access/entitlements)

- `public.entitlements`
  - Grants access to a `product_gid`.
  - Can be represented either as:
    - user-based: `user_id` references `auth.users(id)`
    - email-based (pre-claim): `purchaser_email` + optional `shopify_*` GIDs
  - Unique constraints ensure you don’t duplicate grants for the same `(user_id, product_gid)` or `(purchaser_email, product_gid)` (when `user_id` is null).
  - Revocation/expiration supported via `revoked_at` and `expires_at`.

## RLS model (read vs write)

This schema enables RLS broadly, but the policies are intentionally restrictive:

- Client reads are allowed via `SELECT` policies for “own” rows:
  - `profiles`, `user_preferences`, `activity_events` (only events where `user_id = auth.uid()`), `memberships`, `points_ledger`, `reward_redemptions`, `entitlements`
- Client reads are allowed for some public catalog data:
  - `rewards` via `SELECT` policy restricted to `is_active = true`
- Most client writes/mutations are blocked by absence of `INSERT/UPDATE/DELETE` policies:
  - Comments in the migration call out that event writes, memberships/points/reward redemption writes, and entitlement mutations should happen via server/admin flows.
- `anonymous_visitors` has RLS enabled but no client-facing policies in these migrations.

Implication: app server code uses an admin Supabase client for inserts/updates (so it can bypass RLS).

## Flow chart: anonymous tracking -> user bootstrap -> entitlement claiming

```mermaid
flowchart TD
  A[Client sends activity event] --> B{Logged in?}

  B -- Yes --> C[POST /api/activity/track\nsupabase.auth.getUser()]
  C --> D[insert activity_events\nuser_id = auth user id]

  B -- No --> E[Read anon cookie (ANON_COOKIE_NAME)]
  E --> F{anon visitor exists?}
  F -- No --> G[ensureAnonymousVisitor\nINSERT anonymous_visitors]
  F -- Yes --> H[Update last_seen_at]
  G --> I[insert activity_events\nanonymous_visitor_id = visitor.id]
  H --> I[insert activity_events\nanonymous_visitor_id = visitor.id]

  I --> J[User authenticates / signs in]
  J --> K[POST /api/auth/bootstrap\nupsert profiles + user_preferences]
  K --> L[mergeAnonymousVisitorIntoUser]

  L --> M[Claim entitlements:\nUPDATE entitlements\nset user_id where purchaser_email matches\nand user_id is null and revoked_at is null]
  L --> N[Reassign anonymous activity:\nUPDATE activity_events\nset user_id where anonymous_visitor_id matches\nand user_id is null]
  L --> O[Mark anonymous visitor claimed:\nUPDATE anonymous_visitors\nset claimed_by_user_id]
```

