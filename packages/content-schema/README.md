# @organic/content-schema

Shared Zod schemas and helpers for Organic Sonics content: product taxonomy (allowed product types and tags), product metafield shapes, composition and free resource schemas, Shopify Files naming rules, audio tag and preview specs.

Used by:

- **The storefront (this repo):** through the pnpm workspace (`workspace:*`), re-exported from `lib/schemas.ts`.
- **The private admin app:** installed from this public repo, pinned to a git tag:
  ```json
  "@organic/content-schema": "github:InceptionCode/organic-the-label#content-schema-v0.1.0&path:/packages/content-schema"
  ```

## Releasing a change to the admin app

1. Change the schema here and keep the storefront green (`pnpm test:ci`).
2. Bump `version` in this package's `package.json`, commit and push.
3. Tag the commit `content-schema-v<version>` and push the tag:
   ```bash
   git tag content-schema-v0.1.1
   git push origin content-schema-v0.1.1
   ```
4. In the admin repo, bump the tag in its `package.json` and run `pnpm install`.

The package ships TypeScript source (no build step). Consumers list it in Next's `transpilePackages`.
