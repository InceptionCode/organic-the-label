# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [2.0.0] - 2026-11-04

### ✨ Highlights

Organic Sonics v2 is a full rebuild of the site, now live on organicsonics.com.

- **New app:** rebuilt on TanStack Start with server rendering, replacing the Next.js site. Webhooks and scheduled jobs moved to a separate Hono service (`apps/api`), and the repo is now a bun monorepo.
- **Redesign:** every page redesigned and built mobile-first, with a new flat, full-page design.
- **SEO:** page titles and descriptions, canonical URLs, Open Graph tags, structured data, a sitemap and robots.txt on all public pages. Preview sites are not indexed.
- **Accounts:** password, magic link and password reset flows. Anonymous visitors are tracked only after they do something stateful, and purchases made as a guest attach to the account with the same verified email.
- **Performance:** a 150 KB budget on the startup bundle, enforced in CI. Heavy visuals load late, and pages for signed-out visitors are cached on the CDN and cleared by webhooks.
- **Personalization groundwork:** activity tracking and saved preferences. The newsletter checkbox now really subscribes and unsubscribes.
- **Testing and CI:** Playwright end-to-end and accessibility tests, new bun-based CI for v2 and `apps/api`, and a cache flush after each deploy.
- **Links:** old v1 sign-in and download links redirect to their v2 paths, so emails already sent keep working.

### 🚀 Features

- Activity tracking, preferences and email events logic ([`dcf2507`](https://github.com/InceptionCode/organic-the-label/commit/dcf2507132f79c816fac273357107b1b4bc41c20))
- Completed redesign and build of all pages ([`3149ee4`](https://github.com/InceptionCode/organic-the-label/commit/3149ee469b2c98a9369d5670905ebf1e9459ac0f))
- Visuals and shell components, initial site design plumming ([`a9771e0`](https://github.com/InceptionCode/organic-the-label/commit/a9771e0da61290acec56b50a8123b1a949dc60d5))
- Additional v2 plumming and auth flows ([`1bbd2b8`](https://github.com/InceptionCode/organic-the-label/commit/1bbd2b8d7b2de7beee90be570eb2e6d4b8794f2b))
- Vercel deploy config + complete auth foundation ([`856bc99`](https://github.com/InceptionCode/organic-the-label/commit/856bc99714cc2721d4f60c9d309858e4d906dcfd))
- Add email+password sign in and sign up auth functions ([`63349cb`](https://github.com/InceptionCode/organic-the-label/commit/63349cb4aaf828c640e1c5a125ac8358b988efc3))
- Phase 5 — data layer + complete auth foundation ([`47f0439`](https://github.com/InceptionCode/organic-the-label/commit/47f04392a25e04aa309883dad7e9742381aed417))
- Phase 4 — Supabase auth migration ([`742ce8b`](https://github.com/InceptionCode/organic-the-label/commit/742ce8b6a47e84fa5a274e4fd5f8856cf6ca5e0b))
- Phase 3 — tanstack start 1.168 scaffold ([`4a73807`](https://github.com/InceptionCode/organic-the-label/commit/4a73807b04aa21955f866ebaecbad0582463f159))
- Phase 2 — hono api layer scaffold ([`da77514`](https://github.com/InceptionCode/organic-the-label/commit/da77514dd648af0271b25c609b033ab72e37cbe9))
- Phase 1 — monorepo architecture + bun migration ([`e602900`](https://github.com/InceptionCode/organic-the-label/commit/e60290025b48512d529ce7fe4fd3c6c40beb2420))

### 🐛 Bug Fixes

- Production now reads the correct env ([`5ec9112`](https://github.com/InceptionCode/organic-the-label/commit/5ec9112f07f90a765ef4d272690977f11ec5f8ff))
- Fix missing product issue ([`8f1ecb0`](https://github.com/InceptionCode/organic-the-label/commit/8f1ecb00086dfcbcae32a59446d24509f3eb5682))
- Small update to deploy flush, dev merge ([`7a06e19`](https://github.com/InceptionCode/organic-the-label/commit/7a06e19be6ff09cd20b7a1b435f9a85a144926b5))
- V1 broken due to Supabase HCAPTCHA site protection rule ([`1191554`](https://github.com/InceptionCode/organic-the-label/commit/119155419df861e07ff84d2a73f891727a36e1a5))
- Bun-types failed Vercel build ([`cc44f57`](https://github.com/InceptionCode/organic-the-label/commit/cc44f578d5b239e221df10b2f74ed90e222f3705))
- Fix tsc cast and vercel output directory AGAIN ([`c35a3cc`](https://github.com/InceptionCode/organic-the-label/commit/c35a3cc99c4dbbc5fe646601bfe4b75b4f6f655b))
- Fix tsc cast and vercel output directory ([`950dc64`](https://github.com/InceptionCode/organic-the-label/commit/950dc64bf9dbbeb4c3cc7b3c16fa92da218a96f0))
- Resolve vercel build failures ([`1ab5f09`](https://github.com/InceptionCode/organic-the-label/commit/1ab5f090517ce47821eab31ac015be36e1dcd174))
- Cast bun headers type to fix tsc error on vercel build ([`7e48878`](https://github.com/InceptionCode/organic-the-label/commit/7e488787ec8f05751adab6a6a96cb4561ddfe88e))
- Wire middleware/auth.ts and guard json parse in revalidate-product ([`7e89a5d`](https://github.com/InceptionCode/organic-the-label/commit/7e89a5d992bde78a88e7f3cadcffc19a03dfdd21))

### ⚡ Performance

- Caching improvements and other optimizations ([`70eb181`](https://github.com/InceptionCode/organic-the-label/commit/70eb18118b9ce97011ce28b3b28c09688126244d))
- Full e2e suite and performance enhancements ([`ff26481`](https://github.com/InceptionCode/organic-the-label/commit/ff264819ea0c31af67489c9aad6429f8de96dbc7))

### 🚜 Refactor

- Replan a v1 lift and prep new apps ([`f5123fe`](https://github.com/InceptionCode/organic-the-label/commit/f5123fea5765f6c1c948493fc740caec2dea93c6))

### ⚙️ CI & Build

- Stable build for v2 ([`1f79fbb`](https://github.com/InceptionCode/organic-the-label/commit/1f79fbbe0dcd1766700a651a0d9a1f893b426907))
- Apps/api vercel build fix ([`cc798fb`](https://github.com/InceptionCode/organic-the-label/commit/cc798fbfb8d4102d94192609f85fb5018f781fbc))
- Robot.txt, sitemapping, other seo logic ([`73d6745`](https://github.com/InceptionCode/organic-the-label/commit/73d6745890dd4bd99c94e5c463d943e4d2e10783))
- Additional v2 plumming and service/fn modules ([`b46e043`](https://github.com/InceptionCode/organic-the-label/commit/b46e043d3d338cdd122347b0fea01540f4c69822))
- Routing, env and vercel setup ([`d8b057d`](https://github.com/InceptionCode/organic-the-label/commit/d8b057d99d9dd83f12789d2f3565a69111b0c609))

### 🧹 Chores

- Dead code cleanup and dependency audit ([`ac805e7`](https://github.com/InceptionCode/organic-the-label/commit/ac805e791bebc8ec81b4572f4bed9bae51fffb3f))
- Auto-delete vite config timestamp files on dev start ([`43f4c43`](https://github.com/InceptionCode/organic-the-label/commit/43f4c437881ec94852833326ada9506d42ac559e))
## [1.9.0] - 2026-10-25

### 🚀 Features

- Put credits in composition file names (#32) ([`bccbe0f`](https://github.com/InceptionCode/organic-the-label/commit/bccbe0f8264557f54bdfb5e0f263b7ddc68de9a6)) in [#32](https://github.com/InceptionCode/organic-the-label/pull/32)

### 🐛 Bug Fixes

- V1 broken due to Supabase HCAPTCHA site protection rule ([`7c9c380`](https://github.com/InceptionCode/organic-the-label/commit/7c9c380adc5a5bef9df341f5e312c4ea011cfbbb))

### ⚙️ CI & Build

- Drop the changelog bot and prepend release notes instead ([`a5b231f`](https://github.com/InceptionCode/organic-the-label/commit/a5b231ff6396f61f503b7a810d09314abf54f351))
## [1.8.0] - 2026-10-04

### 🚀 Features

- Show 5 audio previews and scroll the rest (#27) ([`be99d6c`](https://github.com/InceptionCode/organic-the-label/commit/be99d6c9853b64404acd3d45316e41f4fb319d44))
- Read BPM, key and credits from any filename (#26) ([`1098669`](https://github.com/InceptionCode/organic-the-label/commit/1098669849d81a1a23ec77fc643f058ac6dfb3c7))
- Bundle the terms of use as a PDF (#25) ([`a732f3f`](https://github.com/InceptionCode/organic-the-label/commit/a732f3fa9c03aeaba5efc2e1f08af0014cffed7e))
- New shared package and resource management changes (#24) ([`25fea84`](https://github.com/InceptionCode/organic-the-label/commit/25fea84b6459049fd67d7024553f5d57b67347ee))

### 📚 Documentation

- Documentation on update release strategy ([`72016ff`](https://github.com/InceptionCode/organic-the-label/commit/72016ff2a12b91e81331285176a5e93fab9f7d41))
- Move internal docs out of git and sync docs with the app ([`715bbe3`](https://github.com/InceptionCode/organic-the-label/commit/715bbe3ac396eadc8431e371bacef825e3347e49))

### 🧪 Testing

- Allow the bundle redirect on composition downloads (#28) ([`f4933d8`](https://github.com/InceptionCode/organic-the-label/commit/f4933d8a008ff8d6ac7cac0ec885de98fd7b472e))
## [1.7.1] - 2026-09-16

### 🚀 Features

- Use screenshot and link-out card for Muso.ai ([`b64314d`](https://github.com/InceptionCode/organic-the-label/commit/b64314d615bf2446574a25d79a83103d205dad99))

### 🧹 Chores

- Small updates to match v1.7.0 ([`d18fc10`](https://github.com/InceptionCode/organic-the-label/commit/d18fc10a2945cee970e07b94fc53888eadc68c4c))
- Small updates to match v1.7.0 (#22) ([`7c37d11`](https://github.com/InceptionCode/organic-the-label/commit/7c37d111da57ac7055d79a39d9e91fff4b144201)) in [#22](https://github.com/InceptionCode/organic-the-label/pull/22)
## [1.7.0] - 2026-09-10

### 🚀 Features

- New work-with-me route + API integrations and splash page ([`e744d03`](https://github.com/InceptionCode/organic-the-label/commit/e744d03c6e753ae06a4e1c0e87aa1b95e8cb42b3))

### 🐛 Bug Fixes

- Added an attempt to proxy reels for playback ([`54513c8`](https://github.com/InceptionCode/organic-the-label/commit/54513c80bec9f25e7b5a7aa5fc9e331dc4ead29a))

### ⚡ Performance

- Improve tooling for faster DX + update global CI config ([`ca08a65`](https://github.com/InceptionCode/organic-the-label/commit/ca08a653028bfaa53d723b8d2a7e10339860358e))
- Improve tooling for faster DX + added timeouts for CI testing ([`1b91a4e`](https://github.com/InceptionCode/organic-the-label/commit/1b91a4e60fba60048377885dae65d3ca2f39de5c))

### 📚 Documentation

- Updated release-process.md ([`225b599`](https://github.com/InceptionCode/organic-the-label/commit/225b5997ab7438881552a0c3d44241d49b0319ee))

### 🧹 Chores

- Release v1.6.1 CHANGELOG + composition route (#19) ([`57a6b48`](https://github.com/InceptionCode/organic-the-label/commit/57a6b48bea643c846e06998ece3fcdddbe942110)) in [#19](https://github.com/InceptionCode/organic-the-label/pull/19)
## [1.6.1] - 2026-09-05

### 🚀 Features

- Added free loop library with instant zip downloads ([`ae468f5`](https://github.com/InceptionCode/organic-the-label/commit/ae468f535835dfdc9be404d68d130e9bdb1f0009))
- Squash merge feature/checkout-flow and bump to 1.4.1 ([`b4609df`](https://github.com/InceptionCode/organic-the-label/commit/b4609df9a303c938345c7363c965671487fd0530))
- Flow G — support status update webhook (squash merge) ([`bfa626d`](https://github.com/InceptionCode/organic-the-label/commit/bfa626d9899d708432587eb80b91950ce23487f7))
- Full email architecture — Phases 1–6 (squash merge) ([`17b1df3`](https://github.com/InceptionCode/organic-the-label/commit/17b1df3f4f51c843ba69298128dfcc000db5f046))
- Squash merge feature/testing — full test suite, CI clean ([`feb9ea4`](https://github.com/InceptionCode/organic-the-label/commit/feb9ea41523b697a8c0b0e4255e1454f8a76cacf))
- Squash merge feature/testing — full test suite 80%+ coverage ([`d6c5eeb`](https://github.com/InceptionCode/organic-the-label/commit/d6c5eeb4fba1cb1671b978a5c874f5903c9691df))

### 🐛 Bug Fixes

- Added a cache-bust webhook for compositions table updates ([`db7b08f`](https://github.com/InceptionCode/organic-the-label/commit/db7b08f630296a505a82466615a82c46ff54a3bc))
- Resolve two flaky Playwright test failures ([`d76967e`](https://github.com/InceptionCode/organic-the-label/commit/d76967e62a263b49ea87ffacac9b9dbf276e6dcc))
- Add missing Resend env secrets and lazy-initialize client ([`e931f6e`](https://github.com/InceptionCode/organic-the-label/commit/e931f6e7f18f243f390ba00308d20a4fd955b841))
- Add SVG module declaration for next/image static imports ([`703a2fb`](https://github.com/InceptionCode/organic-the-label/commit/703a2fb407431b36b2e649cce3ae8e0a41c0ca16))

### ⚙️ CI & Build

- Release now included in CI-main for deploy protection ([`fc04733`](https://github.com/InceptionCode/organic-the-label/commit/fc04733409c213d9f3093970d09185ab9a65d3a5))

### 🧹 Chores

- Enhance development setup and improve store page functionality ([`1731322`](https://github.com/InceptionCode/organic-the-label/commit/17313221489528a6d0b359b41a89cc14ab781a4d))
- Update dependencies and improve documentation ([`cd39c28`](https://github.com/InceptionCode/organic-the-label/commit/cd39c2801f638d192a01dd58f1e3a35d2c03eebb))

