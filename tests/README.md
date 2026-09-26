# Tests

This directory contains the test suite for Organic Sonics. The strategy is documented in [`/docs/testing-strategy.md`](/docs/testing-strategy.md) and the full blueprint in [`/docs/internal-docs/testing-blueprint.md`](/docs/internal-docs/testing-blueprint.md).

---

## Running tests

```bash
# All unit + integration tests (fast — no browser)
pnpm test:ci

# Watch mode for active development
pnpm test:watch

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests (starts `pnpm dev`, or reuses one already on :3000)
pnpm test:e2e

# E2E smoke tests only
pnpm test:e2e:smoke

# Everything
pnpm test:all

# E2E exactly as CI runs it (fresh server, cleared .next)
pnpm test:e2e:cold

# Coverage report (text summary + HTML in coverage/)
pnpm test:coverage
```

---

## Folder structure

```
tests/
├── unit/             Pure logic tests — no DOM, no network
│   ├── auth/         Auth store, init, state-change resolution, helpers
│   ├── cart/         Cart store math and business logic
│   ├── composition/  Embed URLs, search param normalization
│   ├── email/        Resend, MailerLite, contact sync, validation
│   ├── store/        Filters, store data parsing, activity tracker store
│   ├── utils/        Shared helper logic
│   └── work-with-me/ Embed helpers
│
├── integration/      Component behavior tests — DOM, mocked network
│   ├── auth/         Auth-aware UI
│   ├── cart/         Add-to-cart button, cart drawer
│   ├── composition/  Cards, filters, revalidate webhook handler
│   ├── email/        Support-status webhook handler
│   ├── membership/   Membership CTA visibility
│   ├── splash/       Session splash, scroll-scrub hero
│   └── store/        Store page rendering
│
├── e2e/              Full browser tests against the running app
│   ├── global-setup.ts         Warms every route before the suite
│   ├── store.spec.ts           Browse, PDP, filter, search
│   ├── cart.spec.ts            Add, quantity, remove, checkout handoff
│   ├── auth.spec.ts            Sign up, sign in/out, gated content
│   ├── compositions.spec.ts    Browse, filter/URL sync, zip download
│   ├── email.spec.ts           /free and /contact forms
│   └── work-with-me.spec.ts    Page, nav link, inquiry form
│
├── fixtures/         Typed, reusable test data
│   ├── products.ts
│   ├── users.ts
│   ├── cart.ts
│   └── compositions.ts
│
├── mocks/            MSW request handlers
│   ├── handlers.ts   Route handlers for Shopify + Supabase API calls
│   └── server.ts     MSW server instance (used in vitest.setup.ts)
│
└── utils/
    ├── render.tsx    Custom render with app providers
    └── factories.ts  Helper functions for generating fixture variations
```

---

## Test types and when to use each

| Type | Use for | Tools |
|------|---------|-------|
| Unit | Pure logic: cart math, filter helpers, schema validation, auth mapping | Vitest |
| Integration | Component behavior with mocked data: cart drawer, product grid, auth-aware UI | Vitest + Testing Library + MSW |
| E2E | Critical user flows in a real browser: browse → add to cart → checkout, sign in/out | Playwright |

### Rule of thumb

If the code has no UI and no network — **unit test it**.  
If the code renders DOM and calls mocked routes — **integration test it**.  
If the flow requires a real browser and real server — **E2E test it**.

---

## Mocking rules

### Unit tests
Mock everything external: Shopify clients, Supabase clients, cookies, router, analytics.
Goal: test logic in isolation.

### Integration tests
Use MSW to intercept route calls (`/api/store/cart/...`, `/api/auth/...`).
Add handlers in `tests/mocks/handlers.ts`.
Don't mock internal app logic — let it run.
Goal: test app wiring with realistic data, not real network.

### E2E tests
Keep as close to production as possible.
Use a dedicated test Supabase user account.
Do NOT complete real Shopify checkout — verify the handoff URL only.

---

## Fixtures

Fixtures live in `tests/fixtures/` and are typed against `lib/schemas.ts`.

- **products.ts** — `mockProduct`, `mockExclusiveProduct`, `mockFreeProduct`
- **users.ts** — `anonUser`, `signedInUser`, `memberUser`, `supabaseAnonUser`, `supabaseSignedInUser`
- **cart.ts** — `mockCart`, `emptyCart`, `mockCartLine`, `mockCartLineTwo`, `multiItemCart`
- **compositions.ts** — `mockComposition`, `mockYouTubeComposition`, `mockCompositionListItem`

Use factories in `tests/utils/factories.ts` (`makeProduct`, `makeCart`, `makeUser`) to generate variations:

```ts
import { makeProduct } from '../utils/factories'
const beatProduct = makeProduct({ category: 'beat', price: 19.99 })
```

---

## Adding new tests

1. **Unit test**: Create `tests/unit/{domain}/your-helper.test.ts`. Import the real function. Test edge cases.
2. **Integration test**: Create `tests/integration/{domain}/your-component.test.tsx`. Import the real component. Use `render` from `tests/utils/render.tsx`. Add MSW handlers if the component fetches.
3. **E2E test**: Add a new `test()` or `test.describe()` block to the relevant `tests/e2e/*.spec.ts` file. Add `data-testid` attributes to the app elements you need to select.

---

## Naming conventions

- Unit/integration: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`
- Describe blocks: use the component or function name — `describe('CartDrawer', ...)`
- Test names: use plain English — `it('shows empty state when cart has no lines')`

---

## CI

- **PRs** (`ci-pr.yml`): lint + typecheck + `pnpm test:ci` (unit + integration only)
- **Pushes to `main`, `dev`, `release/**`** (`ci-main.yml`): lint + typecheck + build + unit/integration + E2E
- `ci.yml` is an older combined workflow that still runs on PRs and pushes to `main` / `dev`

See [`/docs/testing-strategy.md`](/docs/testing-strategy.md) for the full philosophy and scope decisions.
