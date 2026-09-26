# Testing Strategy — Organic Sonics

> Full implementation blueprint: [`/docs/internal-docs/testing-blueprint.md`](/docs/internal-docs/testing-blueprint.md)  
> Test runner docs: [`/tests/README.md`](/tests/README.md)

---

## Current goals

The V1 test suite exists to protect the parts of the site that matter most: the money flows and user trust flows. It is intentionally minimal — built to survive, not to impress.

**What we are protecting right now:**

1. Store browsing and product display
2. Cart behavior (add, update, remove, total)
3. Checkout handoff to Shopify
4. Auth (sign up, sign in, sign out, session state)
5. Gated/member-specific content behavior
6. Lead capture and support forms (`/free`, `/contact`, `/work-with-me`) and the email sync behind them
7. Compositions browsing and zip downloads

**What we are not chasing right now:**

- High coverage percentages
- Snapshot tests for every component
- Deep testing of Radix UI or Framer Motion behavior
- V2 features that don't exist yet
- Live payment completion in E2E

---

## Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit + Integration | Vitest + Testing Library | Logic and component behavior |
| DOM | jsdom | Browser environment simulation |
| Request mocking | MSW | Intercepts fetch/API calls in tests |
| E2E | Playwright | Real browser flows |
| CI | GitHub Actions | PR and main branch validation |

---

## Test layers

### Unit tests (`tests/unit/`)

For pure logic with no DOM and no network.

**Write unit tests for:**
- Cart subtotal calculations and quantity rules
- Product filter tag building (`lib/product/build-filter-tag.ts`)
- Search param normalization (`lib/product/normalize-search-params.ts`, `lib/composition/normalize-search-params.ts`)
- Embed URL parsing (`lib/composition/embed-url.ts`, `lib/work-with-me` embeds)
- Email clients and contact sync (`lib/email/*`, mocked Resend / MailerLite)
- Auth user mapping (`store/auth-context.tsx` — `mapSupabaseUser`)
- Zod schema validation (`lib/schemas.ts` — `SigninFormSchema`, `SignupFormSchema`)
- Membership/entitlement helper logic

**Do NOT unit test:**
- React components (that's integration)
- Shopify API behavior (that's the Shopify SDK's job)
- Supabase behavior (mock it)

### Integration tests (`tests/integration/`)

For component behavior with mocked network.

**Write integration tests for:**
- Store product grid renders correctly from fixture data
- Cart drawer opens, shows items, and handles interactions
- Auth-aware navbar and account UI
- Membership CTA visibility by user state
- Composition cards and filters
- First-visit splash / scroll-scrub hero
- Webhook route handlers called directly (compositions revalidate, support-status)

**Rules:**
- Use MSW to mock API routes — do not hit real Shopify or Supabase
- Test what the user sees and what happens when they interact
- Do not test Radix UI primitives — they're already tested upstream

### E2E tests (`tests/e2e/`)

For critical flows that require a real browser and real server.

**Keep each spec focused on critical flows. Current specs:**

| Spec | Covers |
|------|--------|
| `store.spec.ts` | Store loads, product list, PDP navigation, category filter, search |
| `cart.spec.ts` | Add to cart, drawer, quantity update, remove, per-card loading state, checkout handoff URL |
| `auth.spec.ts` | Sign up confirmation dialog, password mismatch, sign in, account UI, sign out, auth-gated content |
| `compositions.spec.ts` | Page loads, loop cards, newsletter CTA, search filter, zip download response, filter/URL sync |
| `email.spec.ts` | `/free` starter kit form and `/contact` support form (success, validation, category select) |
| `work-with-me.spec.ts` | Page loads, nav link, CTA scrolls to inquiry form, message validation |

Tests tagged `@smoke` run with `pnpm test:e2e:smoke`. `tests/e2e/global-setup.ts` warms every route once before the suite so cold `next dev` compiles don't land inside a test.

---

## Mocking philosophy

**In unit tests:** Mock everything external. The point is to test logic in isolation.

**In integration tests:** Use MSW to mock network routes. Never mock internal app logic.

**In E2E tests:** Use real services with test accounts. Control only what is inherently unstable:
- Use a dedicated test user account in Supabase
- Verify checkout handoff by URL, don't complete real payment
- Seed predictable test products if possible

---

## Fixture strategy

Fixtures live in `tests/fixtures/`. They are:
- Typed against `lib/schemas.ts` — they break if the schema changes (which is good)
- Minimal but realistic — enough detail to represent real data
- Named for what they represent (`mockProduct`, `memberUser`, `emptyCart`)

Use `tests/utils/factories.ts` to generate variations without duplicating fixture objects.

---

## Environment strategy

| Environment | Test types | Services |
|------------|-----------|---------|
| Local | Unit, Integration, E2E | All mocked except E2E which uses real local server |
| CI (PR) | Unit + Integration | Mocked |
| CI (main) | Full suite including E2E | Real server, mocked third parties |

E2E tests need a running server. Playwright's `webServer` config runs `pnpm dev`: it reuses an already-running server locally and always starts a fresh one on CI. `pnpm test:e2e:cold` reproduces the CI setup locally (frees port 3000, clears `.next`, sets `CI=1`). Test credentials (`PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`) load from `.env.test`.

---

## CI strategy

### PRs (`ci-pr.yml`)
- Runs on every PR to `main` or `dev`
- Lint → typecheck → unit + integration tests
- Fast — no build, no E2E
- Designed to give immediate feedback before review

### Main branch (`ci-main.yml`)
- Runs on every push to `main`, `dev`, or `release/**`
- Full suite: lint → typecheck → build → unit/integration → E2E (Chromium)
- Playwright report uploaded on failure

### Legacy validate (`ci.yml`)
- Runs on PRs and pushes to `main` / `dev`
- Env presence check → build → lint → typecheck → `pnpm test`
- Overlaps with the two workflows above; candidate for removal once `ci-pr` / `ci-main` are the required checks

### Branch protection
After the first passing PR, add `CI — PR` as a required check in GitHub repo settings.
This prevents merging anything that breaks lint, types, or unit/integration tests.

---

## Intentional non-scope (for now)

These are good ideas for later. Don't build them now.

- Visual regression testing
- Coverage gating (collect but don't fail on %)
- End-to-end webhook delivery (handlers are integration-tested directly; real Shopify/Supabase/MailerLite delivery is not)
- Real email delivery (Resend / MailerLite are mocked)
- Analytics event validation
- Contract tests for Shopify/Supabase APIs
- Smoke E2E against Vercel preview deployments

Expand coverage when real bugs tell you where the cracks are — not before.

---

## Expansion path

Once V1 tests are stable and you've shipped a few PRs:

1. Add `data-testid` attributes to the app as you write E2E selectors
2. Fill in the integration test TODOs in `tests/integration/`
3. Write the unit test TODOs in `tests/unit/`
4. Add `@smoke` tags to your most critical E2E paths for fast CI
5. Set branch protection rules to require `CI — PR` to pass before merge
6. After a real bug hits: write a regression test, then fix it
