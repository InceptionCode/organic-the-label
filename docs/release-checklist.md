# Release Checklist

## Before merging release/x.y.z -> main

Run against staging (`dev.organicsonics.com`) or a local production build (`bun run --cwd apps/v2 build && bun run --cwd apps/v2 preview`). See step 6 of [release-process.md](./release-process.md).

- [ ] CI is green
- [ ] Homepage loads
- [ ] Store page loads
- [ ] Product detail page loads
- [ ] Product filters/sorting work
- [ ] Add to cart works from store grid
- [ ] Add to cart works from PDP
- [ ] Cart badge updates
- [ ] Cart drawer opens and closes
- [ ] Cart quantity controls work
- [ ] Checkout button points to Shopify checkout
- [ ] Audio previews work
- [ ] `/compositions` lists loops and a download returns a zip
- [ ] `/free`, `/contact`, and `/work-with-me` forms submit
- [ ] `/free` and every live `/free/[slug]` page load; the emailed download link records the download and redirects
- [ ] `/compositions` download works for a rebuilt composition (redirect to the Shopify Files ZIP) and a legacy one (zipped on the fly)
- [ ] All new Supabase migrations are applied to **prod** (`bunx supabase migration list --linked` against prod shows no pending rows)
- [ ] If `packages/content-schema` changed: version bumped, `content-schema-vX.Y.Z` tag pushed, and `GITHUB_TOKEN="$(gh auth token)" bunx git-cliff --bumped-version` still prints a `vX.Y.Z` storefront version
- [ ] Sign up, sign in, and sign out work
- [ ] Signed in with favorites: `/explore` and `/store` show recommendations, an owned product is not among them, and unchecking the box on `/account` hides both on the next load
- [ ] `bun run --cwd apps/v2 check:entry` passes (150 KB entry budget)
- [ ] Feature flags are correct for production
- [ ] Webhooks are healthy (Shopify `products/update` + `orders/paid`, Supabase compositions / support-status, MailerLite)
- [ ] Instagram cron (`apps/api`, `/cron/instagram-refresh`) last run succeeded
- [ ] No test/dev console errors in critical routes
- [ ] No obvious console/runtime errors in critical flows

## After the release is live

- [ ] `post-deploy-flush.yml` finished for the production deployment
- [ ] If `packages/content-schema` changed, bump its tag in the private admin repo, run `pnpm install` + `pnpm check` there (the admin repo still uses pnpm), and deploy the admin app (see **Shared package releases** in [release-process.md](./release-process.md))
