# Release Checklist

## Before merging release/x.y.z -> main

Run against staging (`dev.organicsonics.com`) or a local `pnpm serve` build. See step 6 of [release-process.md](./release-process.md).

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
- [ ] Sign up, sign in, and sign out work
- [ ] Feature flags are correct for production
- [ ] Webhooks are healthy (Shopify `products/update` + `orders/paid`, Supabase compositions / support-status, MailerLite)
- [ ] Instagram cron (`/api/cron/instagram-refresh`) last run succeeded
- [ ] No test/dev console errors in critical routes
- [ ] No obvious console/runtime errors in critical flows
