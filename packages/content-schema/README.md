# @organic/content-schema

Shared Zod schemas and helpers for Organic Sonics content: product taxonomy (allowed product types and tags), product metafield shapes, composition and free resource schemas, Shopify Files naming rules, audio tag and preview specs.

Used by:

- **The storefront (this repo):** through the pnpm workspace (`workspace:*`), re-exported from `lib/schemas.ts`.
- **The private admin app:** installed from this public repo, pinned to a git tag:
  ```json
  "@organic/content-schema": "github:InceptionCode/organic-the-label#content-schema-v0.1.0&path:/packages/content-schema"
  ```

## Releasing a new version

Full steps, versioning rules and ordering live in `docs/release-process.md` (**Shared package releases**). In short:

1. Change the package on a normal branch (`feat(content-schema): ...`) and keep the storefront green (`pnpm test:ci`, `pnpm type-check`, `pnpm build`).
2. Bump `version` in this `package.json` by hand: major for breaking changes, minor for additions (new tag, field or schema), patch for same-shape fixes. Don't run `pnpm version`; it creates a `vX.Y.Z` tag that the storefront release tooling would treat as a storefront release.
3. After the squash-merge into `dev`, tag that commit with an annotated tag and push it:
   ```bash
   git tag -a content-schema-v0.2.0 -m "content-schema v0.2.0" <merged-sha>
   git push origin content-schema-v0.2.0
   ```
4. If storefront parsing changed (allowed tags or types), release the storefront first.
5. In the admin repo: bump the tag in `package.json`, `pnpm install`, `pnpm check`, commit `package.json` + `pnpm-lock.yaml`, deploy.

Never move or delete a pushed `content-schema-*` tag; release a new version instead.

The package ships TypeScript source (no build step). Consumers list it in Next's `transpilePackages`.
