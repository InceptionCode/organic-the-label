// Builds apps/api for Vercel using the Build Output API v3.
// Docs: https://vercel.com/docs/build-output-api/configuration
//       https://vercel.com/docs/build-output-api/primitives (Node.js function config)
//
// Output (relative to apps/api):
//   .vercel/output/config.json                       routes every path to the `index` function, plus crons
//   .vercel/output/functions/index.func/index.mjs    single bundled ESM handler (no .ts at runtime)
//   .vercel/output/functions/index.func/package.json { "type": "module" }
//   .vercel/output/functions/index.func/.vc-config.json
//
// Run with: bun run build (from apps/api).
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const outputDir = join(root, ".vercel", "output");
const funcDir = join(outputDir, "functions", "index.func");

const NODE_RUNTIME = "nodejs24.x";
const MAX_DURATION_SECONDS = 30;

const CRONS = [{ path: "/cron/instagram-refresh", schedule: "0 8 * * 1" }];

await rm(outputDir, { recursive: true, force: true });
await mkdir(funcDir, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, "src", "vercel-entry.ts")],
  outdir: funcDir,
  naming: "index.mjs",
  target: "node",
  format: "esm",
  // Inline every dependency (relative modules, @organic/* .ts workspace packages and npm deps)
  // so the function needs no node_modules and never resolves a .ts file at runtime.
  packages: "bundle",
  splitting: false,
  sourcemap: "linked",
  minify: { syntax: true, whitespace: false, identifiers: false },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  throw new Error("[build-vercel] bundling failed");
}

await writeFile(join(funcDir, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");

await writeFile(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: NODE_RUNTIME,
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: MAX_DURATION_SECONDS,
    },
    null,
    2,
  ) + "\n",
);

await writeFile(
  join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }],
      crons: CRONS,
    },
    null,
    2,
  ) + "\n",
);

for (const out of result.outputs) {
  console.log(`[build-vercel] ${out.path.replace(root + "/", "")} ${(out.size / 1024).toFixed(1)} KiB`);
}
console.log(`[build-vercel] wrote ${outputDir.replace(root + "/", "")} (runtime ${NODE_RUNTIME}, maxDuration ${MAX_DURATION_SECONDS}s)`);
