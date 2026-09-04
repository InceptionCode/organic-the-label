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

# E2E tests (requires local dev server)
pnpm test:e2e

# E2E smoke tests only
pnpm test:e2e:smoke

# Everything
pnpm test:all

# Coverage report (opens in browser after run)
pnpm test:coverage
```

---

## Folder structure

```
tests/
├── unit/             Pure logic tests — no DOM, no network
│   ├── cart/         Cart state math and business logic
│   ├── store/        Filter, sort, pagination, search param helpers
│   ├── auth/         Session mapping, schema validation
│   └── utils/        Any shared helper logic
│
├── integration/      Component behavior tests — DOM, mocked network
│   ├── store/        Store page and product card rendering
│   ├── cart/         Cart drawer interactions
│   ├── auth/         Auth-aware UI (navbar, membership CTA)
│   └── membership/   Gated content rendering
│
├── e2e/              Full browser tests against the running app
│   ├── store.spec.ts  Browse store, filter, sort
│   ├── cart.spec.ts   Add to cart, update quantity, remove, checkout handoff
│   └── auth.spec.ts   Sign in, sign out, gated content
│
├── fixtures/         Typed, reusable test data
│   ├── products.ts
│   ├── users.ts
│   └── cart.ts
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
- **users.ts** — `anonUser`, `signedInUser`, `memberUser`
- **cart.ts** — `mockCart`, `emptyCart`, `mockCartLine`

Use factories in `tests/utils/factories.ts` to generate variations:

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

- **PRs**: lint + typecheck + `pnpm test:ci` (unit + integration only)
- **Main branch**: full suite including E2E + build validation
- Workflows live in `.github/workflows/ci-pr.yml` and `.github/workflows/ci-main.yml`

See [`/docs/testing-strategy.md`](/docs/testing-strategy.md) for the full philosophy and scope decisions.
