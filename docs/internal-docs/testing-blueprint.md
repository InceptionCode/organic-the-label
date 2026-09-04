Here’s the concrete blueprint.

I’m going to optimize for four things:

1. low overhead
2. high confidence on money/user flows
3. clean expansion later
4. strong DevOps credibility from the testing + CI story

Since live web search is unavailable here, I’m avoiding version-specific recommendations and keeping this stack/tooling guidance at the architectural level.

# 1. Testing goals for your app

## Primary goal

Protect the parts of the site that matter most right now:

- store browsing
- product viewing
- cart behavior
- checkout handoff
- auth/user flows
- gated/member behavior

## Non-goals for now

Do not spend time on:

- chasing high coverage %
- snapshot-heavy testing
- testing every component
- deep testing of future V2 features
- overcomplicated staging infrastructure

## Success criteria

A good first testing rollout means:

- critical store and user flows are protected
- PRs cannot merge if key checks fail
- local testing is easy enough that you actually run it
- docs make it obvious how to add tests later
- Claude only scaffolds the plumbing

---

# 2. Recommended testing stack

Keep it simple.

## Unit + integration

Use:

- **Vitest**
- **Testing Library**
- **jsdom**
- **MSW** for request mocking when needed

Why:

- fast
- TypeScript-friendly
- lighter than older Jest-centered setups
- good for utility logic and React UI behavior

## E2E

Use:

- **Playwright**

Why:

- best all-around DX for browser E2E
- traces, screenshots, videos
- reliable CI support
- great for auth/store flows

## Supporting tools

- **eslint** with testing-related rules if helpful
- **GitHub Actions** for CI
- optional coverage reporting, but do not gate on coverage yet

---

# 3. Test layers and exact responsibility

This is the part that keeps the repo from becoming soup.

## A. Unit tests

Use unit tests for pure logic and business rules.

### What belongs here

- cart math
- subtotal/total calculations
- quantity update rules
- product filtering logic
- sorting logic
- pagination helpers
- auth/session utility helpers
- entitlement/member gating helpers
- feature-flag helpers
- schema validation / transform functions
- Shopify or Supabase response mappers

### What does not belong here

- dumb presentational components
- pages that need a full browser just to prove a button exists
- third-party service behavior

---

## B. Integration tests

Use integration tests where component behavior and app logic meet.

### What belongs here

- store page rendering from mocked product data
- product detail page key behavior
- cart drawer interaction
- auth-aware navbar/account UI
- gated content rendering based on user/member state
- form behavior for core auth entry points
- “empty state / error state / loading state” for important views

### Guideline

These tests should verify:

- user sees the right thing
- user actions cause the right UI/result
- core app wiring behaves correctly

But they should still avoid full real network chains.

---

## C. E2E tests

Use E2E only for the flows that can hurt you financially or break trust.

### First-pass E2E scope

Keep it to around **5 to 8 tests**.

#### Must-have flows

1. user can browse store
2. user can open product detail page
3. user can add item to cart
4. user can update/remove cart item
5. checkout handoff works
6. user can sign in / sign out
7. gated/member experience behaves correctly
8. basic store sort/filter still works

That’s enough. More can come later after real bugs tell you where the cracks are.

---

# 4. Folder structure

Here is a clean, scalable structure.

```txt
/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  └─ ...
│
├─ tests/
│  ├─ unit/
│  │  ├─ cart/
│  │  ├─ store/
│  │  ├─ auth/
│  │  └─ utils/
│  │
│  ├─ integration/
│  │  ├─ store/
│  │  ├─ cart/
│  │  ├─ auth/
│  │  └─ membership/
│  │
│  ├─ e2e/
│  │  ├─ store.spec.ts
│  │  ├─ cart.spec.ts
│  │  ├─ auth.spec.ts
│  │  └─ membership.spec.ts
│  │
│  ├─ fixtures/
│  │  ├─ products.ts
│  │  ├─ users.ts
│  │  ├─ memberships.ts
│  │  └─ sessions.ts
│  │
│  ├─ mocks/
│  │  ├─ shopify/
│  │  ├─ supabase/
│  │  └─ handlers.ts
│  │
│  ├─ utils/
│  │  ├─ render.tsx
│  │  ├─ test-env.ts
│  │  ├─ factories.ts
│  │  └─ playwright/
│  │
│  └─ README.md
│
├─ playwright.config.ts
├─ vitest.config.ts
├─ vitest.setup.ts
└─ .github/
   └─ workflows/
```

## Why this structure works

- test types are separated clearly
- fixtures and mocks are reusable
- onboarding future tests is obvious
- CI mapping becomes straightforward

---

# 5. What to test first

Here’s your exact first wave.

## Wave 1: unit tests

Start with the highest-leverage logic.

### cart

- calculate subtotal
- apply quantity changes
- remove item
- derive total item count
- handle invalid quantity input if applicable

### store

- sort products correctly
- filter by tag/type
- preserve pagination logic
- query param parsing helpers
- product availability/visibility helpers

### auth/user

- session/user mapping logic
- auth state helpers
- membership entitlement checks
- redirect decision helpers for protected content

### transforms

- Shopify product normalization
- price formatting helpers
- metafield parsing if used
- safe fallbacks for missing product data

---

## Wave 2: integration tests

### store page

- renders list of products from mocked response
- sort changes update visible results
- filter changes update visible results
- empty state shows correctly
- error state shows correctly

### product page

- product title, image, price, preview content render
- unavailable product state is handled safely
- add-to-cart action can be triggered

### cart drawer

- opens and shows selected items
- quantity change updates totals
- remove action updates state
- checkout CTA appears and is enabled when expected

### auth-aware UI

- signed-out navbar state
- signed-in navbar/account state
- gated UI content differs correctly by user/member status

---

## Wave 3: E2E tests

### 1. browse store

- visit store page
- confirm products render
- open a product detail page

### 2. cart flow

- add item to cart
- verify cart badge updates
- open cart drawer
- update quantity
- remove item

### 3. checkout handoff

- add item
- click checkout
- verify redirect/handoff behavior is correct

### 4. auth flow

- sign in
- verify logged-in UI
- sign out
- verify logged-out UI

### 5. member gating

- visit gated route/content as non-member
- verify block/CTA
- visit as eligible member
- verify access

### 6. sort/filter smoke

- apply sort
- apply filter
- verify results change and page remains stable

That’s your minimum real suite.

---

# 6. Mocking strategy

This needs hard rules.

## Unit tests

Mock aggressively.

- Shopify clients
- Supabase clients
- cookies
- router/navigation
- analytics
- feature flag services
- server-only helpers

Goal: isolate logic.

## Integration tests

Mock network boundaries, not internal behavior.
Use:

- fixture data
- MSW handlers
- mocked auth/session state

Goal: test app behavior with realistic data, not real third-party systems.

## E2E

Keep as close to real as practical, but control unstable dependencies.

### Good candidates to keep controlled

- fake or seeded test products
- test user accounts
- predictable membership states
- checkout destination verification rather than actually completing payment

### Important

You do **not** need to fully complete live payment in E2E right now.
For now, testing the checkout handoff is enough unless your checkout stack is custom enough that the real completion path must be tested in-browser.

---

# 7. Test data strategy

This is a hidden make-or-break area.

## You need:

- 2 to 4 stable product fixtures
- 1 out-of-stock product fixture
- 1 signed-out state
- 1 normal signed-in user
- 1 paid/member user
- 1 gated-content scenario
- 1 empty-state scenario
- 1 error-state scenario

## Suggested fixture shape

Keep fixtures:

- small
- typed
- reusable
- realistic enough to match production patterns

## Rule

Do not let every test invent its own random data blob.
That way lies chaos and sadness.

---

# 8. Environment strategy

You need predictable environments for tests.

## Local

Use:

- mocked services for unit/integration
- local app server for E2E
- dedicated test env vars

## CI

Use:

- same test commands as local
- deterministic env values
- no hidden manual setup
- Playwright browser install step
- artifacts on failure

## Preview

Preview deployments should at minimum validate:

- build
- typecheck
- lint
- unit/integration tests

Optional:

- smoke E2E against preview later

## Production

Production deploy should be blocked by required CI checks.

---

# 9. CI/CD workflow blueprint

This is the part that helps your DevOps story too.

## PR workflow

Run on every PR:

- install deps
- lint
- typecheck
- unit tests
- integration tests
- maybe 1 to 2 smoke E2E tests if runtime is reasonable

### Goal

Fast feedback. Catch obvious breakage before merge.

---

## Main branch workflow

Run on merge to main:

- lint
- typecheck
- full unit suite
- full integration suite
- full E2E suite
- production build validation

### Goal

Main stays healthy.

---

## Release workflow

Before release:

- confirm required checks passed
- optionally deploy preview/staging
- run smoke verification if you later add it
- deploy production

### Important

Do not create a release process where production deploys first and “we’ll see what happens” second.

---

# 10. GitHub Actions shape

You asked for blueprint, so here’s the conceptual workflow split.

## Workflow A: `ci-pr.yml`

Triggered on:

- pull_request

Runs:

- setup node
- install deps
- lint
- typecheck
- unit/integration tests
- optional smoke E2E

## Workflow B: `ci-main.yml`

Triggered on:

- push to main

Runs:

- setup
- lint
- typecheck
- unit/integration tests
- full E2E
- build

## Workflow C: `deploy.yml`

Triggered on:

- successful main checks / release flow

Runs:

- deployment only after required statuses are green

If your hosting platform already wires deployment to GitHub, then your real task is to make sure branch protection rules require the right checks before merge.

---

# 11. Recommended commands

Keep the scripts dead simple.

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:ci": "pnpm test:unit && pnpm test:integration",
    "test:all": "pnpm test:ci && pnpm test:e2e"
  }
}
```

You can tweak naming, but the principle matters:

- one obvious command for local fast tests
- one for E2E
- one for CI
- one for everything

---

# 12. Documentation you should add

Keep docs short and sharp.

## `tests/README.md`

Include:

- what kinds of tests exist
- where they live
- how to run them
- when to write unit vs integration vs E2E
- mocking rules
- fixture rules
- naming conventions
- CI expectations

## `docs/testing-strategy.md` or similar

Keep this higher-level:

- current goals
- current scope
- what is intentionally not covered yet
- future expansion ideas

This is especially useful when using Claude so it doesn’t improvise an entire testing religion.

---

# 13. Claude’s role vs your role

This should be explicit.

## Claude should generate

- Vitest config
- Playwright config
- setup files
- base folder structure
- MSW bootstrap
- example fixtures
- example test utilities
- GitHub Actions files
- README/docs skeleton
- 1 or 2 sample tests per layer

## You should write

- cart logic tests
- store utility tests
- membership/auth tests
- integration assertions for real UI behavior
- final E2E flow coverage
- future regressions based on real bugs

That matches your learning goal exactly.

---

# 14. What not to do in the first rollout

Do not:

- block yourself on perfect test architecture
- spend days mocking every possible edge case
- test every Radix/UI behavior
- use coverage % as your north star
- make E2E depend on fragile live third-party systems
- build huge custom test abstractions too early

Your first testing setup should feel boring in a good way.

---

# 15. Expansion path later

Once V1 tests are stable, expand based on pain, not vibes.

## Next likely additions later

- webhook processing tests
- email flow tests
- richer protected-route/member-content tests
- analytics event validation
- visual regression for premium UI if needed
- contract tests for service boundaries

But none of that needs to happen now.

---

# 16. Suggested rollout order for the next 1 to 2 weeks

## Step 1

Bootstrap:

- Vitest
- Testing Library
- Playwright
- MSW
- folder structure
- scripts
- docs
- GitHub Actions

## Step 2

Write first unit tests:

- cart utils
- filter/sort utils
- membership gating helpers

## Step 3

Write first integration tests:

- store page
- cart drawer
- auth-aware navbar/account state

## Step 4

Write first E2E tests:

- browse store
- add to cart
- checkout handoff
- auth flow

## Step 5

Add branch protection rules
Require passing CI before merge.

## Step 6

After first few PRs, refine:

- remove pain points
- simplify flaky tests
- improve fixtures
- only then add more coverage

---

# 17. The clean strategy in one sentence

**Unit test the logic, integration test the important UI wiring, E2E test the revenue and user journeys, and keep CI strict enough to matter but light enough to live with.**

That’s the blueprint.
